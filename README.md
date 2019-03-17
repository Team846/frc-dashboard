# Dashboard
Either clone this repository, or [download](https://github.com/akainth015/frc-dashboard/archive/master.zip) it as a zip,  then unzip it.

Once you've done that, you can `cd` into the directory, and run the following command:

~~~
pynetworktables2js --team 846
~~~

A server will start up, and you can visit the dashboard at `http://localhost:8888`.

You may find it convenient to create a `bat` file with the following contents

~~~
cd %PATH_TO_dashboard_DIR%
start "" http://localhost:8888
pynetworktables2js --team 846
~~~

Double clicking it will do all of the above for you (except downloading this repository).

Note that the included `pynetworktables2js` executable is a special version built from a version that supports backups and `Infinity` and `NaN` values. [Here](https://github.com/akainth015/pynetworktables2js) is the repository if you're interested. Without the special executable, you cannot download/restore backups. 