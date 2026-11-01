#!/bin/bash
# usage: cmd.sh REC_DIR 'js body'  — runs it in the live rec.mjs page, prints the result
R="$1"; rm -f "$R/CMD.out"; printf '%s' "$2" > "$R/CMD"
for i in $(seq 1 120); do [ -f "$R/CMD.out" ] && { cat "$R/CMD.out"; echo; exit 0; }; sleep 0.5; done; echo TIMEOUT
