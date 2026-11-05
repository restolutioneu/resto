function isCalledFromSoftPos() {
    return navigator.userAgent.indexOf("SoftPos") !== -1;
}


function getApiType() {
    if (!isCalledFromSoftPos()) {
        return "NONE";
    }
    if (window.softPosApi424242) {
        //old synchronous Jfx HtmlView
        return "HTMLVIEW_LEGACY";
    } else if (window.softPos && window.softPos.placeOrder) {
        return "HTMLVIEW_JXBROWSER";
    } else {
        //New JCEF
        return "HTMLVIEW_JCEF";
    }
}

function onlyJxSupported(actionFn, errorFn) {
    const apiVersion = getApiType();

    function errorResponse(msg) {
        if (errorFn) {
            errorFn(msg);
        } else {
            console.error("Error: " + msg);
        }
    }

    if (!apiVersion || apiVersion == 'NONE') {
        console.trace("API not supported");
        errorResponse("SoftPoS API not supported on standalone web applications, please consult Kassamagneetti support");
    }
    if (apiVersion == "HTMLVIEW_LEGACY") {
        console.trace("API not supported in legacy");
        errorResponse("SoftPoS API supported only on JxBrowser");
    } else if (apiVersion == "HTMLVIEW_JCEF") {
        console.trace("API not supported in jcef");
        errorResponse("SoftPoS API supported only on JxBrowser");
    } else if (apiVersion == "HTMLVIEW_JXBROWSER") {
        actionFn();
    }
}

function compileLogMessage(msg, obj) {
    if (obj === undefined) {
        return msg;
    } else {
        return msg + ": " + JSON.stringify(obj);
    }
}

let parseResultAndMakeCallbacks = function (result, failureCallback, successCallback) {
    if (typeof result === 'string' || result instanceof String) {
        result = JSON.parse(result);
    }
    if (!result.success && (result.statusCode || result.message)) {
        if (failureCallback) {
            failureCallback(result);
        }
    } else if (successCallback) {
        successCallback(result);
    }
}


const softPos = {
    /**
     * JSON API methods to control the SoftPoS CashRegister, see also https://github.com/Soft-Contact/resto/issues/2#placeorder
     *  @namespace jsonApi
     **/
    jsonApi: {
        /**
         * Place order
         * @param order as a JSON object
         * @param successCallback as a function for successful callback
         * @param failureCallback as a function for failure callback
         */
        placeOrder: function (order, successCallback, failureCallback) {
            const apiVersion = getApiType();
            if (!apiVersion || apiVersion == 'NONE') {
                console.error("API not initialized " + apiVersion);
                if (failureCallback) {
                    failureCallback("API not initialized " + apiVersion);
                }
                return;
            }
            if (apiVersion == "HTMLVIEW_LEGACY") {
                let resp = JSON.parse(window.softPosApi424242.jsonPlaceOrder(JSON.stringify(order)));
                if (!resp.success) {
                    if (failureCallback) {
                        failureCallback(resp);
                    }
                } else if (successCallback) {
                    successCallback(resp);
                }
            } else if (apiVersion == "HTMLVIEW_JXBROWSER") {
                let result = window.softPos.placeOrder(JSON.stringify(order));
                parseResultAndMakeCallbacks(result, failureCallback, successCallback);
            } else if (apiVersion == "HTMLVIEW_JCEF") {
                window.softPosPlaceOrder({
                        request: JSON.stringify(order),
                        onSuccess: successCallback,
                        onFailure: function (dummy, responseStr) {
                            failureCallback(JSON.parse(responseStr));
                        }
                    }
                );
            }
        },
        /**
         * addToOpenTable
         * @param openTable as a JSON object from https://github.com/Soft-Contact/resto/issues/2#addtoopentable
         * @param successCallback as a function for successful callback
         * @param failureCallback as a function for failure callback
         */
        addToOpenTable: function (openTable, successCallback, failureCallback) {
            onlyJxSupported(() => {
                let result = window.softPos.addToOpenTable(JSON.stringify(openTable));
                parseResultAndMakeCallbacks(result, failureCallback, successCallback);
            });
        },
        /**
         * listUsersWithOpenTables, see https://github.com/Soft-Contact/resto/issues/2#listUsersWithOpenTables
         * @param successCallback as a function for successful callback
         * @param failureCallback as a function for failure callback
         */
        listUsersWithOpenTables: function (successCallback, failureCallback) {
            onlyJxSupported(() => {
                let result = window.softPos.listUsersWithOpenTables();
                parseResultAndMakeCallbacks(result, failureCallback, successCallback);
            });
        },

        /**
         * get currently on cashregister screen active transaction
         * @param successCallback
         * @param failureCallback
         */
        getActiveTransaction: function (successCallback, failureCallback) {
            onlyJxSupported(() => {
                let result = window.softPos.getActiveTransaction();
                parseResultAndMakeCallbacks(result, failureCallback, successCallback);
            });
        },
        /**
         * Execute lisp macro on cashregister side
         * @param cmd lisp macro to execute
         * @param successCallback
         * @param failureCallback
         * @deprecated use evalLisp instead, kept some time for backwards compatibility
         */
        executeLisp: function (cmd, successCallback, failureCallback) {
            onlyJxSupported(() => {
                let result = window.softPos.evalLisp(cmd);
                parseResultAndMakeCallbacks(result, failureCallback, successCallback);
            });
        },

        /**
         * Evaluate lisp macro on cashregister side
         * @param cmd lisp macro to evaluate
         * @param successCallback
         * @param failureCallback
         */
        evalLisp: function (cmd, successCallback, failureCallback) {
            onlyJxSupported(() => {
                let result = window.softPos.evalLisp(cmd);
                parseResultAndMakeCallbacks(result, failureCallback, successCallback);
            });
        }

    },
    /**
     * JSON API methods to control the SoftPoS CashRegister printing
     *  @namespace printer
     **/
    printer: {

        /**
         * Experimental: Print data to the printer
         * @example
         let printData =
         {
         lines: [

         { type: "TEXT", contents: "test string"},
         { type: "TEXT", contents: "text\non\nmultiple\nlines"},
         { type: "QR_CODE", contents: "sample code", alignment: "RIGHT"},
         { type: "BAR_CODE", contents: "1234567890123"},
         { type: "QR_CODE", contents: "another code"},
         ]
         }
         * @requires SoftPoS 21.11.2 at least
         * @todo experimental
         */
        print: function (printData, successCallback) {
            onlyJxSupported(() => {
                let resp = window.softPos.print(JSON.stringify(printData));
                if (successCallback) {
                    successCallback(resp);
                }
            });
        }

    },

    /**
     * JSON API methods to control the SoftPoS CashRegister payment terminal
     *  @namespace payments
     **/
    payments: {
        /**
         * Experimental: Authorize payment on SoftPoS side using SoftPos configured payment device
         * @requires SoftPoS 21.11.2 at least
         * @todo experimental
         */
        authorizePayment: function (payment, successCallback, failureCallback, statusCallback) {
            onlyJxSupported(() => {
                window.softPos.authorizePayment(payment, function (result) {
                    if (typeof result === 'string' || result instanceof String) {
                        result = JSON.parse(result);
                    }
                    if (!result.success) {
                        if (failureCallback) {
                            failureCallback(result);
                        }
                    } else if (successCallback) {
                        successCallback(result);
                    }
                }, function (status) {
                    if (statusCallback) {
                        statusCallback(status);
                    }
                });
            });
        },

        /**
         * Experimental: Abort currently active payment
         * @requires SoftPoS 21.11.2 at least
         * @todo experimental
         */
        abortAuthorization(successCallback) {
            onlyJxSupported(() => {
                let resp = window.softPos.abortAuthorization();
                if (successCallback) {
                    successCallback(resp);
                }
            });
        },

        /**
         * Experimental: Start prereading mode
         * @requires SoftPos 26.04.2 at least
         * @param successCallback
         * @param failureCallback
         */
        startSscPrereadingMode(successCallback, failureCallback) {
            onlyJxSupported(() => {
                const cmd = "(sok-ssc-identify-customer)";
                let result = window.softPos.evalLisp(cmd);
                parseResultAndMakeCallbacks(result, failureCallback, successCallback);
            });
        },

        /**
         * Experimental: Abort prereading mode
         * @requires SoftPos 26.04.2 at least
         * @param successCallback
         * @param failureCallback
         */
        abortSscPrereadingMode(successCallback, failureCallback) {
            onlyJxSupported(() => {
                const cmd = "(sok-ssc-abort)";
                let result = window.softPos.evalLisp(cmd);
                parseResultAndMakeCallbacks(result, failureCallback, successCallback);
            });
        },

        /**
         * Experimental: Set SSC loyalty
         * @requires SoftPos 26.04.2 at least
         * @param loyaltyJson as strng
         * @param successCallback
         * @param failureCallback
         */
        setSscLoyalty(loyaltyJson, successCallback, failureCallback) {
            onlyJxSupported(() => {
                if (loyaltyJson === undefined) {
                    loyaltyJson = "";
                }
                const escapedString = loyaltyJson
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"');
                const cmd = "(sok-ssc-set-transaction-loyalty " + escapedString + ")";
                let result = window.softPos.evalLisp(cmd);
                parseResultAndMakeCallbacks(result, failureCallback, successCallback);
            });
        }

    },

    /**
     * JSON API methods to get article and article group data
     */
    articles: {
        /**
         * Get all articles from SoftPos
         * @requires SoftPoS 21.12.15 at least
         */
        listAll: function (successCallback, errorCallback) {
            onlyJxSupported(() => {
                try {
                    let resp = window.softPos.getArticles();
                    if (successCallback) {
                        successCallback(JSON.parse(resp));
                    }
                } catch (e) {
                    console.error("Error in listAll", e);
                    if (errorCallback) {
                        errorCallback(e);
                    }
                }
            });
        },

        /**
         * Get article price @Experimental
         * @requires SoftPoS 26.04.02 at least
         */
        getPrice: function(priceReq, successCallback, errorCallback) {
            onlyJxSupported(() => {
                let result = window.softPos.getPrice(JSON.stringify(priceReq));
                parseResultAndMakeCallbacks(result, errorCallback, successCallback);
            });
        },

        /**
         * Get many article prices @Experimental
         * @requires SoftPoS 26.04.02 at least
         */
        getPrices: function(priceReq, successCallback, errorCallback) {
            onlyJxSupported(() => {
                let result = window.softPos.getPrices(JSON.stringify(priceReq));
                parseResultAndMakeCallbacks(result, errorCallback, successCallback);
            });
        },

        /**
         * Get many article prices @Experimental
         * @requires SoftPoS 26.05.02 at least
         */
        calculatePrices: function(priceReq, successCallback, errorCallback) {
            onlyJxSupported(() => {
                let result = window.softPos.calculatePrices(JSON.stringify(priceReq));
                parseResultAndMakeCallbacks(result, errorCallback, successCallback);
            });
        }



    },

    /**
     * API methods needed by various separate displays (KitchenDisplay, OrderDisplay).
     */
    displays: {
        /**
         * Experimental: List all transactions based on jobOrderSystemId
         * @param jobOrderSystemId Job order system id from which to list transactions
         * @todo experimental
         */
        listAllKitchenSystemTransactions: function (jobOrderSystemId, successCallback, errorCallback) {
            onlyJxSupported(() => {
                try {
                    let resp = window.softPos.getKitchenSystemTransactions(jobOrderSystemId);
                    parseResultAndMakeCallbacks(resp, errorCallback, successCallback);
                } catch (e) {
                    if (errorCallback) {
                        errorCallback(e);
                    } else {
                        console.error("Error in listAllKitchenSystemTransactions", e);
                    }
                }
            });
            //
        },

        /**
         * Experimental: Remove transactions based on jobOrderSystemId and transactionUuid
         * @param jobOrderSystemId Job order system id from which to remove transaction
         * @param transactionUuid transcation to remove
         * @todo experimental
         */
        removeTransactionFromKitchenSystem: function (jobOrderSystemId, transactionUuid, successCallback, errorCallback) {
            onlyJxSupported(() => {
                try {
                    let resp = window.softPos.removeTransactionFromKitchenSystem(jobOrderSystemId, transactionUuid);
                    parseResultAndMakeCallbacks(resp, errorCallback, successCallback);
                } catch (e) {
                    if (errorCallback) {
                        errorCallback(e);
                    } else {
                        console.error("Error in removeTransactionFromKitchenSystem", e);
                    }
                }
            });
        },


        /**
         * Experimental: Change transactionsline state
         * @param jobOrderSystemId Job order system id from which to remove transaction
         * @param transactionUuid transcation to modify
         * @param lineStateName   Ordered, Ready, Prepared, Served, Deleted, Other
         * @todo experimental
         */
        setLineStateInKitchenSystem: function (jobOrderSystemId, transactionUuid, lineStateName, successCallback, errorCallback) {
            onlyJxSupported(() => {
                try {
                    let resp = window.softPos.setLineStateInKitchenSystem(jobOrderSystemId, transactionUuid, lineStateName);
                    parseResultAndMakeCallbacks(resp, errorCallback, successCallback);
                } catch (e) {
                    if (errorCallback) {
                        errorCallback(e);
                    } else {
                        console.error("Error in setLineStateInKitchenSystem", e);
                    }
                }
            });
        },

        /**
         * Experimental: Get map of configuration parameters, including custom configuration
         * @todo experimental
         */
        getConfiguration(successCallback, errorCallback) {
            onlyJxSupported(() => {
                try {
                    let resp = window.softPos.getDisplayConfigurations();
                    parseResultAndMakeCallbacks(resp, errorCallback, successCallback);
                } catch (e) {
                    if (errorCallback) {
                        errorCallback(e);
                    } else {
                        console.error("Error in getConfiguration", e);
                    }
                }
            });
        },

        /**
         * Experimental: Save custom configuration
         * @param conf custom configuration
         * @todo experimental
         */
        saveCustomConfiguration(conf, successCallback, errorCallback) {
            onlyJxSupported(() => {
                try {
                    let resp = window.softPos.saveCustomDisplayConfiguration(conf);
                    parseResultAndMakeCallbacks(resp, errorCallback, successCallback);
                } catch (e) {
                    if (errorCallback) {
                        errorCallback(e);
                    } else {
                        console.error("Error in saveCustomConfiguration", e);
                    }
                }
            });
        },

        /**
         * Save kitchen system waiting time in minutes
         */
        saveWaitingTime: function (jobOrderSystemId, waitingTime, successCallback, errorCallback) {
            onlyJxSupported(() => {
                try {
                    let resp = window.softPos.saveWaitingTime(jobOrderSystemId, waitingTime);
                    parseResultAndMakeCallbacks(resp, errorCallback, successCallback);
                } catch (e) {
                    if (errorCallback) {
                        errorCallback(e);
                    } else {
                        console.error("Error in saveWaitingTime", e);
                    }
                }
            });
        },

        /**
         * Get kitchen system waiting time in minutes
         */
        getWaitingTime: function (jobOrderSystemId, successCallback, errorCallback) {
            onlyJxSupported(() => {
                try {
                    let resp = window.softPos.getWaitingTime(jobOrderSystemId);
                    parseResultAndMakeCallbacks(resp, errorCallback, successCallback);
                } catch (e) {
                    if (errorCallback) {
                        errorCallback(e);
                    } else {
                        console.error("Error in getWaitingTime", e);
                    }
                }
            });
        }

    },

    /**
     * Methods related to messages from SoftPos
     */
    messages:
        {
            /**
             * Experimental: Listen for all messages
             * @example
            { type: "COMMAND", data: "REFRESH_KITCHEN_DISPLAY"}
             * @param listenCallbackFn   callback fn where all SoftPoS side asynchronous messages are passed
             * @todo experimental
             */
            listenAll(listenCallbackFn) {
                if (!this.listeners) {
                    this.listeners = [];
                }
                this.listeners.push(listenCallbackFn);
            }
        },

    /**
     *  Utility methods
     *  @namespace utils
     **/
    utils:
        {
            /**
             * Gets the SoftPoS API type depending on which environment is used to run it
             * @returns {string} one of NONE/HTMLVIEW_LEGACY/HTMLVIEW_JCEF
             */
            getApiType: getApiType,
            /**
             * Gets the SoftPoS version
             * @returns {string} SoftPoS version
             */
            getSoftPosVersion: function () {
                return navigator.userAgent;
            },
            /**
             * Get the SoftPos info JSON
             * @requires SoftPoS 21.09.4 at least
             * @returns {json} with fields "success" and "response", where response contains the SoftPosInfo object
             */
            getSoftPosInfo: function (successCallback, failureCallback) {
                onlyJxSupported(() => {
                    let result = window.softPos.getSoftPosInfo();
                    parseResultAndMakeCallbacks(result, failureCallback, successCallback);
                });
            },

            /**
             *  Utility methods for logging
             *  @namespace utils.log
             **/
            log: {

                /**
                 *
                 * @param logRecord
                 * @example
                 window.softPos.log({level: 'INFO', msg:'Info message'});
                 */
                log: function (logRecord) {
                    onlyJxSupported(() => {
                        window.softPos.log(JSON.stringify(logRecord));
                    }, (error) => {
                        console.log(logRecord.msg);
                    });
                },

                /**
                 * Log TRACE message
                 * @param msg
                 * @param obj
                 */
                trace: function (msg, obj) {
                    this.log({message: compileLogMessage(msg, obj), level: "TRACE"});
                },

                /**
                 * Log DEBUG message
                 * @param msg
                 * @param obj
                 */
                debug: function (msg, obj) {
                    this.log({message: compileLogMessage(msg, obj), level: "DEBUG"});
                },

                /**
                 * Log INFO message
                 * @param msg
                 * @param obj
                 */
                info: function (msg, obj) {
                    this.log({message: compileLogMessage(msg, obj), level: "INFO"});
                },

                /**
                 * Log WARN message
                 * @param msg
                 * @param obj
                 */
                warn: function (msg, obj) {
                    this.log({message: compileLogMessage(msg, obj), level: "WARN"});
                },

                /**
                 * Log ERROR message
                 * @param msg
                 * @param obj
                 */
                error: function (msg, obj) {
                    this.log({message: compileLogMessage(msg, obj), level: "ERROR"});
                },

                /**
                 * Log FATAL message
                 * @param msg
                 * @param obj
                 */
                fatal: function (msg, obj) {
                    this.log({message: compileLogMessage(msg, obj), level: "FATAL"});
                }

            }

        }

};

export default softPos;

window.softPosAsyncMsgHandler = function (data) {
    console.warn("Async data from SoftPoS", data);
    if (!softPos.messages.listeners) {
        softPos.messages.listeners = [];
    }
    for (const listenerFn of softPos.messages.listeners) {
        listenerFn(data);
    }
}
