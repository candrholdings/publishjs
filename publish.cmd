@ECHO OFF
SETLOCAL ENABLEDELAYEDEXPANSION
PUSHD "%~dp0"

IF /I "%1" EQU "-clean" GOTO :CLEAN

node tools/publish.js publish.workflow.js %*

GOTO :EOF

:CLEAN
RD temp /S /Q
RD publish /S /Q

GOTO :EOF