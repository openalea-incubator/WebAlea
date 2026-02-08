@ECHO OFF

set SPHINXBUILD=python -m sphinx
set SOURCEDIR=.
set BUILDDIR=_build
set TARGET=%1

if "%TARGET%"=="" set TARGET=html
if not "%1"=="" shift

%SPHINXBUILD% -b %TARGET% %SOURCEDIR% %BUILDDIR%\%TARGET% %*
pause
