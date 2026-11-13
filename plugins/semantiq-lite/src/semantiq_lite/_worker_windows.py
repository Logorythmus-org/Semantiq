"""Documented Win32 Job control for the synthetic worker; not an AppContainer sandbox."""

from __future__ import annotations

import ctypes as c
import sys
import time
from ctypes import wintypes as w
from typing import Any


class _Basic(c.Structure):
    _fields_ = [
        ("process_time", c.c_int64),
        ("job_time", c.c_int64),
        ("flags", w.DWORD),
        ("min_ws", c.c_size_t),
        ("max_ws", c.c_size_t),
        ("processes", w.DWORD),
        ("affinity", c.c_size_t),
        ("priority", w.DWORD),
        ("scheduling", w.DWORD),
    ]


class _IO(c.Structure):
    _fields_ = [
        (name, c.c_uint64)
        for name in (
            "read_ops",
            "write_ops",
            "other_ops",
            "read_bytes",
            "write_bytes",
            "other_bytes",
        )
    ]


class _Extended(c.Structure):
    _fields_ = [
        ("basic", _Basic),
        ("io", _IO),
        ("process_memory", c.c_size_t),
        ("job_memory", c.c_size_t),
        ("peak_process", c.c_size_t),
        ("peak_job", c.c_size_t),
    ]


class _Accounting(c.Structure):
    _fields_ = [(name, c.c_int64) for name in ("user", "kernel", "period_user", "period_kernel")]
    _fields_ += [
        ("faults", w.DWORD),
        ("total", w.DWORD),
        ("active", w.DWORD),
        ("terminated", w.DWORD),
    ]


class _ProcessIds(c.Structure):
    _fields_ = [("assigned", w.DWORD), ("count", w.DWORD), ("ids", c.c_size_t * 64)]


class NativeJob:
    # Explicit declarations also describe this Windows-only object to Linux type checks.
    create: Any
    set_info: Any
    query: Any
    assign: Any
    open_process: Any
    kill: Any
    close_handle: Any
    handle: Any
    wait: Any

    def __init__(self, memory: int, job_memory: int, cpu: int, processes: int) -> None:
        self.kernel: Any
        if sys.platform == "win32":
            self.kernel = c.WinDLL("kernel32", use_last_error=True)
        else:
            raise OSError("CONTROL_UNAVAILABLE")
        self.create = self._api("CreateJobObjectW", [c.c_void_p, w.LPCWSTR], w.HANDLE)
        self.set_info = self._api(
            "SetInformationJobObject", [w.HANDLE, c.c_int, c.c_void_p, w.DWORD], w.BOOL
        )
        self.query = self._api(
            "QueryInformationJobObject",
            [w.HANDLE, c.c_int, c.c_void_p, w.DWORD, c.c_void_p],
            w.BOOL,
        )
        self.assign = self._api("AssignProcessToJobObject", [w.HANDLE, w.HANDLE], w.BOOL)
        self.open_process = self._api("OpenProcess", [w.DWORD, w.BOOL, w.DWORD], w.HANDLE)
        self.kill = self._api("TerminateJobObject", [w.HANDLE, w.UINT], w.BOOL)
        self.close_handle = self._api("CloseHandle", [w.HANDLE], w.BOOL)
        self.wait = self._api("WaitForSingleObject", [w.HANDLE, w.DWORD], w.DWORD)
        self.handle = self.create(None, None)
        if not self.handle:
            raise OSError("CONTROL_UNAVAILABLE")
        info = _Extended()
        info.basic.flags = 0x2000 | 0x100 | 0x200 | 0x2 | 0x8
        info.basic.process_time = cpu * 10_000_000
        info.basic.processes = processes
        info.process_memory, info.job_memory = memory, job_memory
        if not self.set_info(self.handle, 9, c.byref(info), c.sizeof(info)):
            self.close_handle(self.handle)
            self.handle = None
            raise OSError("CONTROL_UNAVAILABLE")

    def _api(self, name: str, arguments: list[Any], returns: Any) -> Any:
        method = getattr(self.kernel, name)
        method.argtypes, method.restype = arguments, returns
        return method

    def attach(self, pid: int) -> None:
        # AssignProcessToJobObject requires PROCESS_SET_QUOTA | PROCESS_TERMINATE.
        handle = self.open_process(0x100 | 0x1, False, pid)
        if not handle:
            raise OSError("CONTROL_UNAVAILABLE")
        try:
            if not self.assign(self.handle, handle):
                raise OSError("CONTROL_UNAVAILABLE")
        finally:
            self.close_handle(handle)

    def finish(self, deadline: float) -> bool:
        members = []
        try:
            # Hold process objects, rather than re-opening PIDs after asynchronous exit.
            ids = _ProcessIds()
            if not self.query(self.handle, 3, c.byref(ids), c.sizeof(ids), None):
                return False
            if ids.count > 64 or ids.assigned > 64:
                return False
            for pid in ids.ids[: ids.count]:
                member = self.open_process(0x100000, False, pid)  # SYNCHRONIZE
                if not member:
                    return False
                members.append(member)
            if not self.kill(self.handle, 124):
                return False
            while True:
                info = _Accounting()
                if not self.query(self.handle, 1, c.byref(info), c.sizeof(info), None):
                    return False
                if info.active == 0 and all(self.wait(member, 0) == 0 for member in members):
                    return True
                if time.monotonic() >= deadline:
                    return False
                time.sleep(0.005)
        finally:
            for member in members:
                self.close_handle(member)
            self.close_handle(self.handle)
            self.handle = None
