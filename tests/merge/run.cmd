@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION
PUSHD "%~dp0"

node ../../tools/publish.js publish.workflow.js -force %*