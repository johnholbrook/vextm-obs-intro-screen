@REM Copies various files associated with the display script to the correct locations in the compiled GUI app
copy .\display.exe .\deploy\win32\build\VexTMIntro\display.exe
xcopy /i .\icon\icon.ico .\deploy\win32\build\VexTMIntro\icon\
xcopy /i .\node_modules\socket.io\client-dist\socket.io.min.js .\deploy\win32\build\VexTMIntro\node_modules\socket.io\client-dist\
xcopy /i .\node_modules\bootstrap\dist\css\bootstrap.min.css .\deploy\win32\build\VexTMIntro\node_modules\bootstrap\dist\css\
xcopy .\src\display\site\ .\deploy\win32\build\VexTMIntro\src\display\site\
rename .\deploy\win32\build\VexTMIntro\qode.exe "VEX TM Intro Screen.exe"