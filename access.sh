#!/bin/sh

function access() {
    node app.js

    status=$?

    if [ $status = 0 ] ; then
        say "正常終了" ; echo "正常終了"
        sleep 10s
        access
    elif [ $status = 130 ] ; then
        say "強制終了" ; echo "強制終了"
    else 
        say "異常終了" ; echo "異常終了"
    fi
}
access
