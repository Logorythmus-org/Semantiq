"""Qualification is separate from configured limits. B1 authorizes no untrusted backend."""

from __future__ import annotations

import platform
import sys
from dataclasses import asdict, dataclass
from typing import Any, Literal

from ._worker_wire import PROTOCOL


@dataclass(frozen=True)
class CapabilityEvidence:
    control: str
    state: Literal["ENFORCED_AND_TESTED", "IMPLEMENTED_NOT_QUALIFIED", "UNAVAILABLE", "NOT_TESTED"]
    evidence: str


@dataclass(frozen=True)
class WorkerCapabilities:
    platform_kind: Literal["WINDOWS_NATIVE", "LINUX_NATIVE", "LINUX_WSL", "UNSUPPORTED"]
    authorization: Literal["B1_SYNTHETIC_ONLY"]
    declared_controls: tuple[str, ...]
    observations: tuple[CapabilityEvidence, ...]

    @property
    def untrusted_documents_enabled(self) -> bool:
        # No qualified backend exists in B1. Caller-supplied claims cannot enable it.
        return False

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["protocol"] = PROTOCOL
        data["untrusted_documents_enabled"] = False
        data["declared_controls"] = list(data["declared_controls"])
        data["observations"] = list(data["observations"])
        return data


def inspect_worker_capabilities() -> WorkerCapabilities:
    kind: Literal["WINDOWS_NATIVE", "LINUX_NATIVE", "LINUX_WSL", "UNSUPPORTED"]
    if sys.platform == "win32":
        kind = "WINDOWS_NATIVE"
    elif sys.platform == "linux":
        kind = "LINUX_WSL" if "microsoft" in platform.release().lower() else "LINUX_NATIVE"
    else:
        kind = "UNSUPPORTED"
    unavailable = (
        "network_confinement",
        "filesystem_confinement",
        "qualified_process_tree",
        "mandatory_resources",
        "hostile_source_capture",
        "parent_death_tree_cleanup",
        "maintained_worker_runtime",
    )
    return WorkerCapabilities(
        kind,
        "B1_SYNTHETIC_ONLY",
        ("bounded_ipc", "parent_wall_deadline", "platform_resource_setup"),
        tuple(
            CapabilityEvidence(name, "UNAVAILABLE", "NO_QUALIFIED_BACKEND") for name in unavailable
        )
        + tuple(
            CapabilityEvidence(
                name,
                "IMPLEMENTED_NOT_QUALIFIED" if kind != "UNSUPPORTED" else "UNAVAILABLE",
                "SYNTHETIC_SETUP_ONLY_NO_RUNTIME_DENIAL_PROOF",
            )
            for name in (
                "wall_deadline",
                "cpu_ceiling",
                "memory_ceiling",
                "environment_handles",
                "bounded_input_output",
                "ordinary_worker_cleanup",
            )
        ),
    )
