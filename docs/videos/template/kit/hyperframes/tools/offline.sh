#!/usr/bin/env bash
# Run a command with no network at all (a fresh network namespace with only loopback up). Needs root.
exec unshare -n bash -c 'python3 - <<"PY"
import socket, fcntl, struct
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
ifr = fcntl.ioctl(s, 0x8913, struct.pack("16sh22x", b"lo", 0))       # SIOCGIFFLAGS
flags = struct.unpack("16sh22x", ifr)[1]
fcntl.ioctl(s, 0x8914, struct.pack("16sh22x", b"lo", flags | 1))     # SIOCSIFFLAGS: IFF_UP
PY
exec "$@"' bash "$@"
