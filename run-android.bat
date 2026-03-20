@echo off
set "GRADLE_USER_HOME=C:\gradle_home"
set "JAVA_HOME=J:\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
subst J: "C:\Program Files\Android\Android Studio" 2>nul
cd /d C:\dev\TimerApp
npx react-native run-android
