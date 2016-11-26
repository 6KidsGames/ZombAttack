@echo off
@rem Run from the root of master to deploy the currently built contents
@rem of the out\ directory to PPE or PROD. PPE or PROD must be the
@rem first parameter.

setlocal
set _env=%~1
if "%_env%"=="PPE" goto :StartDeployment
if "%_env%"=="PROD" goto :StartDeployment
echo ERROR: You must specify a deployment environment PPE or PROD
exit /b 1

:StartDeployment

@echo =================================================================
@echo %_env% Deployment
@echo Checking out Deploy%_env% branch which is configured in
@echo Azure App Service to automatically deploy to the %_env%
@echo ZombAttack site.
@echo =================================================================
call git checkout Deploy%_env%
if ERRORLEVEL 1 echo ERROR: Git checkout failed && exit /b 1
call git pull
if ERRORLEVEL 1 echo ERROR: Git pull failed && exit /b 1
call git reset --hard origin/Deploy%_env%
if ERRORLEVEL 1 echo ERROR: Git reset failed && exit /b 1

@echo =================================================================
@echo Copying build in the out\ directory to the %_env% deployment
@echo directory.
@echo =================================================================
robocopy.exe out\. Deployed\. /s /mir
if ERRORLEVEL 8 echo ERROR: Robocopy failed with errorlevel %ERRORLEVEL%. && exit /b 1

@echo =================================================================
@echo Committing and pushing copied deployment.
@echo =================================================================
call git add Deployed/*
call git commit -am "Deploy %_env%"
call git push --set-upstream origin Deploy%_env%

exit /b 0
