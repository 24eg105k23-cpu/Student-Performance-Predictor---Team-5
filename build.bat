@echo off
setlocal
echo Compilation starting...

:: Compile variables
set SRC_DIR=src
set OUT_DIR=webapp\WEB-INF\classes
set LIB_DIR=webapp\WEB-INF\lib\

:: Create output directory if it doesn't exist
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

:: Build Classpath
set CP=.;%LIB_DIR%*;%CATALINA_HOME%\lib\servlet-api.jar

:: Compile Java Files
echo Compiling all Java files...
javac -d "%OUT_DIR%" -sourcepath "%SRC_DIR%" -cp "%CP%" "%SRC_DIR%\com\spp\util\*.java" "%SRC_DIR%\com\spp\model\*.java" "%SRC_DIR%\com\spp\dao\*.java" "%SRC_DIR%\com\spp\servlet\*.java"

:: Sync frontend files to webapp directory
echo Syncing frontend files...
copy /Y "%cd%\index.html" "%cd%\webapp\index.html"
copy /Y "%cd%\app.js" "%cd%\webapp\app.js"
copy /Y "%cd%\styles.css" "%cd%\webapp\styles.css"
copy /Y "%cd%\test.js" "%cd%\webapp\test.js"

echo.
echo Deploying to Tomcat...
rmdir /S /Q "C:\Program Files\Apache Software Foundation\Tomcat 9.0\webapps\webapp" 2>nul
xcopy /S /Y /I "%cd%\webapp" "C:\Program Files\Apache Software Foundation\Tomcat 9.0\webapps\spp"
echo Deployment finished.

echo Compilation and Deployment completed successfully.
pause
