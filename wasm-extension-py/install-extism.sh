#!/bin/sh

git clone https://github.com/extism/python-pdk
cd python-pdk
make
mv bin/target/release/extism-py ../extism-py
mv lib/target/wasm32-wasi/wasi-deps ../
la -la ../
cd ../
rm -rf python-pdk
