#!/bin/sh
cd `dirname "$0"`/../ui
yarn build
rsync -r --delete dist/ ../static