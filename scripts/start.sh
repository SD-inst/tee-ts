#!/bin/sh
cd `dirname "$0"`/..
unset LD_LIBRARY_PATH
. venv/bin/activate
weight_root=assets/weights index_root=logs rmvpe_root=assets/rmvpe uvicorn --reload main:app