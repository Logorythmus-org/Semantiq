"""Bounded experimental MCP stdio server; not conformance-certified.

Implements the 2025-06-18 lifecycle and two read-only tools. No network/model calls.
"""
from __future__ import annotations

import copy
import json
import math
import sys
from pathlib import Path

from semantic_ir import InvalidInput, Runtime

PROTOCOL_VERSION = '2025-06-18'
MAX_MESSAGE_BYTES = 131072
PACKET_SCHEMA = json.loads((Path(__file__).parent / 'schemas/claim_packet.v0.2.schema.json').read_text())
PACKET_SCHEMA.pop('$id', None)
PACKET_SCHEMA['properties']['version'] = {'enum': ['0.1', '0.2']}
TOOLS = [
    {'name': 'semantiq_evaluate_claim_graph',
     'description': 'Evaluate structured claims against curated offline fixtures; does not authenticate sources or execute actions.',
     'annotations': {'readOnlyHint': True, 'destructiveHint': False, 'openWorldHint': False},
     'inputSchema': {'type': 'object', 'properties': {'packet': PACKET_SCHEMA},
                     'required': ['packet'], 'additionalProperties': False}},
    {'name': 'semantiq_capabilities', 'description': 'Report runtime capabilities and limitations.',
     'annotations': {'readOnlyHint': True, 'destructiveHint': False, 'openWorldHint': False},
     'inputSchema': {'type': 'object', 'additionalProperties': False}},
]


def error(mid, code, message):
    return {'jsonrpc': '2.0', 'id': mid, 'error': {'code': code, 'message': message}}


def strict_loads(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('Duplicate JSON member')
            result[key] = value
        return result

    def constant(value):
        raise ValueError('Non-standard JSON number')

    value = json.loads(raw, object_pairs_hook=pairs, parse_constant=constant)
    pending = [(value, 0)]
    while pending:
        item, depth = pending.pop()
        if depth > 64:
            raise ValueError('JSON nesting exceeds limit')
        if isinstance(item, float) and not math.isfinite(item):
            raise ValueError('Non-finite JSON number')
        if isinstance(item, dict):
            pending.extend((v, depth + 1) for v in item.values())
        elif isinstance(item, list):
            pending.extend((v, depth + 1) for v in item)
    return value


class Endpoint:
    def __init__(self):
        self.engine = Runtime()
        self.state = 'new'

    def handle(self, msg):
        if not isinstance(msg, dict) or msg.get('jsonrpc') != '2.0':
            return error(None, -32600, 'Invalid Request')
        notification = 'id' not in msg
        mid = msg.get('id')
        if not notification and type(mid) not in (str, int):
            return error(None, -32600, 'Request id must be string or integer')
        method = msg.get('method')
        if not isinstance(method, str):
            return error(None, -32600, 'Invalid method')
        params = msg.get('params', {})
        if not isinstance(params, dict):
            return None if notification else error(mid, -32602, 'params must be object')
        if notification:
            if method == 'notifications/initialized' and self.state == 'initializing' and not params:
                self.state = 'ready'
            # Unknown notifications and cancellation of already-finished sync work have no reply.
            return None
        try:
            if method == 'ping':
                result = {}
            elif method == 'initialize':
                if self.state != 'new':
                    return error(mid, -32600, 'Already initialized')
                version = params.get('protocolVersion')
                info = params.get('clientInfo')
                if not isinstance(version, str) or not version:
                    raise InvalidInput('protocolVersion required')
                if not isinstance(params.get('capabilities'), dict):
                    raise InvalidInput('client capabilities required')
                if not isinstance(info, dict) or not all(isinstance(info.get(k), str) and info[k] for k in ('name', 'version')):
                    raise InvalidInput('clientInfo name/version required')
                # Only one supported version; clients requesting another must accept this or disconnect.
                result = {'protocolVersion': PROTOCOL_VERSION,
                          'capabilities': {'tools': {'listChanged': False}},
                          'serverInfo': {'name': 'semantiq-cognitive-experimental', 'version': '0.2.0'}}
                self.state = 'initializing'
            elif method in ('tools/list', 'tools/call'):
                if self.state != 'ready':
                    return error(mid, -32600, 'Initialization handshake required')
                if method == 'tools/list':
                    if params:
                        raise InvalidInput('No pagination cursor or parameters supported')
                    result = {'tools': copy.deepcopy(TOOLS)}
                else:
                    name = params.get('name')
                    args = params.get('arguments', {})
                    if not isinstance(args, dict):
                        raise InvalidInput('arguments must be object')
                    if name == 'semantiq_evaluate_claim_graph':
                        if set(args) != {'packet'}:
                            raise InvalidInput('packet argument required')
                        value = self.engine.evaluate(args['packet'])
                    elif name == 'semantiq_capabilities':
                        if args:
                            raise InvalidInput('no arguments allowed')
                        value = self.engine.info()
                    else:
                        raise InvalidInput('Unknown tool')
                    result = {'content': [{'type': 'text', 'text': json.dumps(value, ensure_ascii=False, allow_nan=False)}],
                              'structuredContent': value, 'isError': False}
            else:
                return error(mid, -32601, 'Method not found')
            return {'jsonrpc': '2.0', 'id': mid, 'result': result}
        except (ValueError, TypeError, KeyError):
            # Do not echo untrusted input or internal exception contents to the host.
            return error(mid, -32602, 'Invalid parameters')


def main():
    endpoint = Endpoint()
    while True:
        line = sys.stdin.buffer.readline(MAX_MESSAGE_BYTES + 1)
        if not line:
            break
        if len(line) > MAX_MESSAGE_BYTES:
            while line and not line.endswith(b'\n'):
                line = sys.stdin.buffer.readline(MAX_MESSAGE_BYTES + 1)
            out = error(None, -32600, 'Message too large')
        else:
            try:
                out = endpoint.handle(strict_loads(line))
            except (UnicodeDecodeError, ValueError, RecursionError):
                out = error(None, -32700, 'Parse error')
        if out is not None:
            sys.stdout.write(json.dumps(out, ensure_ascii=False, allow_nan=False, separators=(',', ':')) + '\n')
            sys.stdout.flush()


if __name__ == '__main__':
    main()
