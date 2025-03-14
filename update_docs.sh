cd docs
mdbook build
cd ../wasm-extension-rs
cargo doc --package moosync-edk --no-deps --target wasm32-wasip1 --target-dir ./docs
cd ../wasm-extension-js
npx typedoc
cd ../wasm-extension-py
source .venv/bin/activate
pdoc --html moosync_edk --force
cd ../
