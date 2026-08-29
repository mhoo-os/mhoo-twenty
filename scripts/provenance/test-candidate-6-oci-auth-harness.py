#!/usr/bin/env python3
"""Loopback-only Bearer challenge proxy for Candidate 6 OCI publication proof."""

import argparse
import base64
import http.client
import json
import os
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def auth_kind(value):
    if value.startswith("Basic "):
        return "basic"
    if value.startswith("Bearer "):
        return "bearer"
    return "missing" if not value else "other"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--listen-port", type=int, required=True)
    parser.add_argument("--backend", required=True)
    parser.add_argument("--log", required=True)
    parser.add_argument("--service", required=True)
    parser.add_argument("--scope", action="append", required=True)
    args = parser.parse_args()
    backend = urllib.parse.urlsplit(args.backend)
    actor = os.environ["OCI_AUTH_HARNESS_ACTOR"]
    github_token = os.environ["OCI_AUTH_HARNESS_GITHUB_TOKEN"]
    bearer_token = os.environ["OCI_AUTH_HARNESS_BEARER_TOKEN"]
    expected_basic = "Basic " + base64.b64encode(f"{actor}:{github_token}".encode()).decode()

    def record(**entry):
        # Credential values intentionally never enter the captured proof log.
        with open(args.log, "a", encoding="utf-8") as log:
            log.write(json.dumps(entry, sort_keys=True) + "\n")

    class Handler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def log_message(self, _format, *_values):
            return

        def challenge(self):
            self.send_response(401)
            self.send_header("WWW-Authenticate", f'Bearer realm="http://127.0.0.1:{args.listen_port}/token",service="{args.service}"')
            self.send_header("Content-Length", "0")
            self.end_headers()

        def token(self):
            parsed = urllib.parse.urlsplit(self.path)
            query = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)
            authorization = self.headers.get("Authorization", "")
            valid = (
                self.command == "GET"
                and authorization == expected_basic
                and any(query == {"service": [args.service], "scope": [scope]} for scope in args.scope)
            )
            record(endpoint="token", method=self.command, auth=auth_kind(authorization), valid=valid)
            if not valid:
                self.send_response(401)
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            body = json.dumps({"token": bearer_token}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def registry(self):
            authorization = self.headers.get("Authorization", "")
            valid = authorization == f"Bearer {bearer_token}"
            record(endpoint="registry", method=self.command, path=urllib.parse.urlsplit(self.path).path, auth=auth_kind(authorization), valid=valid)
            if not valid:
                self.challenge()
                return
            body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
            headers = {key: value for key, value in self.headers.items() if key.lower() not in {"host", "authorization"}}
            connection = http.client.HTTPConnection(backend.hostname, backend.port, timeout=30)
            try:
                request_path = self.path
                connection.request(self.command, request_path, body=body, headers=headers)
                response = connection.getresponse()
                response_body = response.read()
                self.send_response(response.status, response.reason)
                for key, value in response.getheaders():
                    if key.lower() == "location" and value.startswith(args.backend):
                        value = f"http://127.0.0.1:{args.listen_port}" + value[len(args.backend):]
                    if key.lower() not in {"connection", "transfer-encoding", "content-length"}:
                        self.send_header(key, value)
                self.send_header("Content-Length", str(len(response_body)))
                self.end_headers()
                self.wfile.write(response_body)
            finally:
                connection.close()

        def dispatch(self):
            if urllib.parse.urlsplit(self.path).path == "/token":
                self.token()
            elif urllib.parse.urlsplit(self.path).path.startswith("/v2/"):
                self.registry()
            else:
                self.send_response(404)
                self.send_header("Content-Length", "0")
                self.end_headers()

        do_GET = dispatch
        do_POST = dispatch
        do_PUT = dispatch

    ThreadingHTTPServer(("127.0.0.1", args.listen_port), Handler).serve_forever()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
