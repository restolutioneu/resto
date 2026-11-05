# Soft-Contact payment authorization protocol

## Goal

This documents specifies the protocol for authorizing 3rd-party gift cards, mobile payments etc from [Restolution's](https://restolution.eu/) SoftPos cash registers.

## Technical description
The requests are made from SoftPos towards the 3rd-party server using HTTP or (preferably) HTTPS POST request using the [JSON](https://en.wikipedia.org/wiki/JSON) based format defined in this document.
 
All SoftPos cash registers have a unique identifier (UUID).

All amounts are represented by cents (integer) and quantities in 1/1000 parts (integer).

All dates and times are represented using [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601).

UTF-8 is used for character encoding.

Both request and response messages might get additional (optional) parameters in the future.

Note that for the sake of brevity all the JSON examples in this document are formatted.

## Process flow

1. SoftPos sends a request message
2. 3rd-party replies with either 
   * a response message or
   * an error response message or 
   * an HTTP error code

### Request parameters

HTTP request contains two parameters:

1. `request` - [Base64](https://en.wikipedia.org/wiki/Base64) encoded JSON request containing the api key
2. `hash` - [SHA-256](https://en.wikipedia.org/wiki/SHA-256) hash of the JSON request using secret key

3rd-party must verify the hash using the secret key corresponding the api key and **must not** accept the request
in case verification fails.

### Sample session

JSON request:

```json
{"apiKey":"1","requestID":"2","cashRegisterUUID":"3","method":"test","params":
{"param1":"value"}}
```

Base64 encoded JSON request:

```
eyJhcGlLZXkiOiIxIiwicmVxdWVzdElEIjoiMiIsImNhc2hSZWdpc3RlclVVSUQiOiIzIiwibWV0aG9kIjoidGVzd
CIsInBhcmFtcyI6eyJwYXJhbTEiOiJ2YWx1ZSJ9fQ==
```

SHA-256 hash from JSON request (here using password `hunter2`):

```
268b0360dfc7eae551728b28d6c72ad18e76960bbef4a7c6e3fe847093a0e6be
```

Final HTTP request:

```
request=eyJhcGlLZXkiOiIxIiwicmVxdWVzdElEIjoiMiIsImNhc2hSZWdpc3RlclVVSUQiOiIzIiwibWV0aG9
kIjoidGVzdCIsInBhcmFtcyI6eyJwYXJhbTEiOiJ2YWx1ZSJ9fQ==&hash=268b0360dfc7eae551728b28d6c
72ad18e76960bbef4a7c6e3fe847093a0e6be
```

## Request message
 
Required parameters for all requests:

* `timestamp` - time when the request was created
* `requestID` - ID of the request used later in response
* `cashRegisterUUID` - unique identifier of the calling cash register
* `method` - name of the method to call
* `params` - method specific parameters

Optional parameters for all requests:

* `lang` - [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1) language code for response messages
* `businessUnitUUID` - unique identifier of the calling cash register's business unit

request structure:

```json 
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"methodName",
    "params":{
        "param1":"value",
        "param2":"value"
    }
}
``` 

## Response message 

common parameters:

* `timestamp` - time when the response was created
* `requestID` - ID of the original request 
* `success` - shows whether the request was processed successfully (i.e. `true`)
* `message` - optional human readable message which can be shown to user
* `response` - optional method specific result

response structure:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428",
    "response":{
        "field1":"value",
        "field2":"value"
    },
    "message":"optional human readable message"
}
```
 
### Error response 
 
parameters:

* `timestamp` - time when the response was created
* `requestID` - ID of the original request. Optional in case the original request did not contain `requestID`
* `success` - shows whether the request was processed successfully (i.e. `false`)
* `statusCode` - in case of unsuccessful request. see the list of error codes below
* `extraStatusCode` optional integration specific extra error code for `statusCode`
* `message` - optional human readable description of the error which can be shown to user

response structure:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "requestID":"req_28376428",
    "statusCode":"ERR_CODE",
    "message":"human readable error message"
}
```
 
## Common objects

List of common objects used in the request/response of different methods.

### Guest

* `lastName` - last name
* `firstName` - optional first name 
* `creditLimit` - optional credit limit
* `roomNumber` - room number
* `bedNumber` - optional bed number

### Sale row

* `articleID` - article ID
* `articleName` - optional article name
* `quantity` - sale quantity
* `amount` - sale amount
* `tax` - optional tax percentage
* `userMessage` - optional user message
* `rowID` - sale row identifier
* `parentRowID` - identifier of sale row the current sale row is a sub row of
 
#### Payment row

* ``paymentCode`` - payment type code
* ``amount`` - amount in cents
 
## Available methods 

**NOTE** that some of the methods might not be available from some service providers. Different service providers 
have different validation rules for customer number (`customerNumber`) and card number 
(`cardNumber`, `originalCardNumber`, `newCardNumber`) fields. Also some providers might require some optional request 
  parameters / response fields and can add even their own custom (optional) ones.
Check with the 3rd-party for details before implementing this API.

### checkBalance

For checking balance of a card.

parameters:

* `cardNumber` - string containing the card number
* `shortCode` - string containing the card short code (optional but prioritized over cardNumber if used in request)

response:

* `balance` - current balance of the card

sample request with cardNumber:

```json 
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376429",
    "cashRegisterUUID":"c28f32b5-e650-45fb-b11a-d3e0440684d4",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"checkBalance",
    "params":{
        "cardNumber":"123-456"
    }
}
```
sample request with shortCode:

```json 
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376429",
    "cashRegisterUUID":"c28f32b5-e650-45fb-b11a-d3e0440684d4",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"checkBalance",
    "params":{
        "shortCode":"A13HJ8Z"
    }
}
```
    
sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376429",
    "response":{
        "balance":12345
    }
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "statusCode":"INVALID_JSON",
    "message":"Invalid JSON request"
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "requestID":"req_28376429",
    "statusCode":"MISSING_CARD_NUMBER",
    "message":"parameter card number not provided"
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "requestID":"req_28376429",
    "statusCode":"CARD_NOT_FOUND"
}
```

### pay

For paying with a card.

parameters:

* `cardNumber` - string containing the card number
* `transactionUUID` - optional unique identifier of this transaction. Can be used later in `cancel` request
* `amount` - optional for "contract price cards", required otherwise
 
response: 

* `newBalance` - the balance after this operation 
* `amountUsed` - the amount that actually was used in the payment 

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376429",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"pay",
    "params":{
        "cardNumber":"123-456",
        "transactionUUID":"83c6972f-46f9-4a50-a8e0-0b46ac744820",
        "amount":88446
    }
}
```

sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376429",
    "response":{
        "newBalance":12345,
        "amountUsed":12345
    }
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "statusCode":"CARD_NOT_FOUND",
    "requestID":"req_28376429"
}
```

### cancel

For cancelling an existing authorized payment.

parameters:

* `transactionUUID` - unique identifier of the transaction to be cancelled
 
response:

no required fields in the response

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"cancel",
    "params":{
        "transactionUUID":"83c6972f-46f9-4a50-a8e0-0b46ac744820"
    }
}
``` 

sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428"
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "statusCode":"TRANSACTION_UUID_MISSING",
    "requestID":"req_28376428"
}
```

### credit

For adding credit to card.

parameters

* `cardNumber` - string containing the card number
* `transactionUUID` - optional unique identifier of this transaction. Can be used later in cancelling request
* `amount` - amount to add to the card

response: 

* `newBalance` - new balance of the card 

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab", 
    "method":"credit",
    "params":{
        "cardNumber":"123-456",
        "transactionUUID":"83c6972f-46f9-4a50-a8e0-0b46ac744820",
        "amount":10000
    }
}
```

sample response:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428",
    "response":{
        "newBalance":25000
    }
}
```

### registerPurchase 

For registering purchases in bonus systems.
2 different cases are supported:

1) Cash register defined card bonusPrograms (server requires purchases to be listed per bonus program)
* Required parameters: cardNumber, transactionUUID, purchases

2) Undefined general bonusprogram (server determines active bonus programs an applies to sales and payments accordingly)
* Required parameters: customerNumber, transactionUUID, saleRows, paymentRows
* Optional parameters: cardNumber

parameters:

* `customerNumber` - optional string containing the customer number
* `cardNumber` - optional string containing the card number
* `transactionUUID` - optional unique identifier of this transaction. Can be used later in cancelling request
* `purchases` - optional array of purchases eligible for bonus points
    * `bonusProgram` - for identifying the bonus program to which the purchase will be registered 
    * `amount` - the total amount of purchases eligible for bonus points 
    * `quantity` - the total quantity eligible for bonus points
* `saleRows` - optional array of sale rows
* `paymentRows` - optional array of payment rows    
 
response: 

* `newBalance` - new balance of the card  
* `bonusText` - a formatted message relating to bonus program containing the result of registering the purchase
* `macro` - an optional macro string for cash register to evaluate

sample requests:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"registerPurchase",
    "params":{
        "cardNumber":"123-456",
        "transactionUUID":"83c6972f-46f9-4a50-a8e0-0b46ac744820",
        "purchases":[
            {"bonusProgram":"THE_SUM_BONUS","amount":800},
            {"bonusProgram":"SOME_OTHER_BONUS","amount":1200,"quantity":2000},
            {"bonusProgram":"THE_STAMP_BONUS","quantity":1000}
        ]
    }
}
```

```json    
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376429",
    "cashRegisterUUID":"c28f32b5-e650-45fb-b11a-d3e0440684d4",
    "method":"registerPurchase",
    "params":{
        "transactionUUID":"a2ba12dd-3adc-431d-ae11-46f6a47ce040",
        "cardNumber":"123-456",
        "saleRows":[
            {
                "articleID":"666",
                "articleName":"Article 666",
                "quantity":1000,
                "amount":1500,
                "tax":24,
                "rowID":1232445590
            },
            {
                "articleID":"900",
                "articleName":"Cocktail",
                "quantity":1000,
                "amount":0,
                "tax":24,
                "rowID":1232445690
            }
            {
                "articleID":"901",
                "articleName":"Cocktail food",
                "quantity":1000,
                "amount":500,
                "tax":14,
                "rowID":1232445691,
                "parentRowID":1232445690
            }
            {
                "articleID":"902",
                "articleName":"Cocktail alcohol",
                "quantity":4000,
                "amount":1500,
                "tax":24,
                "rowID":1232445692,
                "parentRowID":1232445690
            }
        ],
        "paymentRows":[
            {
                "paymentCode":"CASH",
                "amount":3110
            },
            {
                "paymentCode":"BONUS_DISCOUNT",
                "amount":390
            }
        ]
    }
}
```

sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428",
    "response":{
        "newBalance":110
    }
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "statusCode":"NOT_IMPLEMENTED",
    "requestID":"req_28376428"
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376429",
    "response":{
        "newBalance":110
        "bonusText":"Bonus level reached! Give customer a free soda."
    }
}
```

### registerCustomer

For registering a new customer.

parameters

* `customerNumber` - string containing customer number (ID)
* `customerName` - customer name

response

no required fields in the response

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"registerCustomer",
    "params":{
        "customerNumber":"4100",
        "customerName":"ACME"
    }
}
```

sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428"
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "statusCode":"CUSTOMER_NUMBER_MISSING",
    "requestID":"req_28376428"
}
```

### registerCard

For registering a new card.
 
parameters

* `customerNumber` - string containing customer number
* `cardNumber` - string containing the card number
* `cardHolderName` - optional card holder name
* `articleID` - optional identifier for the article/product voucher being registered
* `balance` - optional initial balance for the card in minor units
* `articleBalance` - optional initial balance for the article/product voucher in 1/1000 parts
* `customData1` - optional integration specific custom data
* `customData2` - optional integration specific custom data
* `customData3` - optional integration specific custom data
* `validFrom` - optional validity start
* `validUntil` - optional validity end

response:

no required fields in the response

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"registerCard",
    "params":{
        "customerNumber":"4100",
        "cardNumber":"123-456",
        "cardHolderName":"John Doe",
        "customData1":"VIP client"
    }
}
```

sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428"
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "statusCode":"CARD_ALREADY_REGISTERED",
    "requestID":"req_28376428"
}
```

### replaceCard

For replacing existing card with a new card by changing card number.

parameters

* `originalCardNumber` - string containing the original card number
* `newCardNumber` - string containing the new card number

response

no required fields in the response

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"replaceCard",
    "params":{
        "originalCardNumber":"876123",
        "newCardNumber":"870000"
    }
}
```

sample response:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428"
}
```

### disableCard

For disabling existing card.

parameters

* `cardNumber` - string containing the card number

response

no required fields in the response

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"disableCard",
    "params":{
        "cardNumber":"870000"
    },
    "lang":"fi"
}
```

sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428"
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "statusCode":"CARD_NOT_FOUND",
    "requestID":"req_28376428",
    "message":"Korttia ei löydy"
}
```

### enableCard

For enabling a disabled card.

parameters

* `cardNumber` - string containing the card number

response

no required fields in the response

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"enableCard",
    "params":{
        "cardNumber":"870000"
    }
}
```

sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428"
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428",
    "message":"Card is already valid"
}
```

### listGuests

For listing guests in Hotel system. Use one of the parameters to filter guests.

parameters:

* `roomNumber` - string containing a room number
* `name` - string containing guest (partial) name
* `code` - string containing key card code or similar 

response:

* `guests` - array of guests

sample requests:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"listGuests",
    "params":{
        "roomNumber":"217"
    }
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"listGuests",
    "params":{
        "code":"3875693875693847"
    }
}
```

sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428",
    "response":{
        "guests":[
            {
                "lastName":"Torrance",
                "firstName":"Jack",
                "roomNumber":"217",
                "bedNumber":1,
                "creditLimit":50000
            },
            {
                "lastName":"Torrance",
                "firstName":"Wendy",
                "roomNumber":"217",
                "bedNumber":1
            },
            {
                "lastName":"Torrance",
                "firstName":"Danny",
                "roomNumber":"217",
                "bedNumber":2
            }
        ]
    }
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "statusCode":"ROOM_NOT_FOUND",
    "requestID":"req_28376428",
    "message":"Room not found"
}
```

### billToRoom

For billing to room in Hotel system. In case of after correction, the amounts and quantities are negated.

parameters:

* `roomNumber` - string containing the room number
* `bedNumber` - optional bed number
* `transactionUUID` - optional unique identifier of this transaction. Can be used later in `cancel` request
* `transactionNumber` - optional transaction number used in receipt printing
* `givenAmount` - total amount given
* `tipAmount` - optional tip amount
* `saleRows` - array of sale rows

response:

no required fields in the response

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376428",
    "cashRegisterUUID":"3aaf2ef6-89ee-4e8f-8191-cbf725435a96",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"billToRoom",
    "params":{
        "roomNumber":"237",
        "transactionUUID":"63e6fda1-0393-46dd-975c-02bdada49f61",
        "transactionNumber":25,
        "givenAmount":1800,
        "tipAmount":200,
        "saleRows":[
            {
                "articleId":"13",
                "articleName":"Koskenkorva",
                "quantity":1000,
                "amount":1200,
                "tax":24
            },
            {
                "articleId":"46",
                "articleName":"Snacks",
                "quantity":2000,
                "amount":600,
                "tax":14
            }
        ]
    }
}
```

sample responses:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376428"
}
```

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":false,
    "statusCode":"LIMIT_EXCEEDED",
    "requestID":"req_28376428",
    "message":"Credit limit exceeded"
}
```
    
### registerCustomerVisit

For registering a customer visit.
This method replaces the command "cuid" in the previous bonus system. 

parameters:

* `customerNumber` - string containing the customer number

response:

* `bonusText` - a message that should be displayed on cash register screen. E.g. if a bonus was reached.
* `macro` - an optional macro string for cash register to evaluate 

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376429",
    "cashRegisterUUID":"c28f32b5-e650-45fb-b11a-d3e0440684d4",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"checkBonus",
    "params":{
        "customerNumber":"123"
    }
}
```
    
sample response:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376429",
    "response":{
        "bonusText":"Happy Birthday!"
    }
}
```

### checkCardBonus

For getting a card bonus status summary and/or discount percentage to apply to current receipt.
This method replaces the command "caid" in the previous bonus system.


parameters:

* `cardNumber` - string containing the card number

response:

* `bonusStatus` - a plain text message that can be displayed on the cash register screen containing general status info about the card's active bonuses
* `discountPercentage` - discount percentage to be applied to currently open receipt
* `discountPaymentCode` - payment code to give to the discount payment row
* `macro` - an optional macro string for cash register to evaluate

sample request:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "apiKey":"user_283764",
    "requestID":"req_28376429",
    "cashRegisterUUID":"c28f32b5-e650-45fb-b11a-d3e0440684d4",
    "businessUnitUUID":"be214e6d-a801-4021-8905-d704ad677eab",
    "method":"checkCardBonus",
    "params":{
        "cardNumber":"123-456",
    }
}
```
    
sample response:

```json
{
    "timestamp":"2015-09-16T08:58:40Z",
    "success":true,
    "requestID":"req_28376429",
    "response":
    {
        "bonusStatus":"Card nr: 123-456\nPoints: 19851\nPoints to reach next (GOLD): 75000\nDays to reach next: 365 \nBalance: 340,68\nLevel: SILVER\nLevel granted: 23.09.2015 14:43:06\nLevel active until: 23.09.2016 14:43:06\nDiscount: 15,00",
        "discountPercentage":15,
        "discountPaymentCode":"BONUS_PAYMENT"
    }
}
```
    
    
## Error codes

* INVALID_JSON - not a valid JSON request
* INVALID_COMMAND - unknown `method`
* NOT_IMPLEMENTED - `method` is not implemented
* MISSING_PARAMETERS - `params` object missing from request
* CARD_NUMBER_MISSING - required parameter `cardNumber` missing
* CUSTOMER_NUMBER_MISSING - required parameter `customerNumber` missing
* AMOUNT_MISSING - required parameter `amount` missing
* TRANSACTION_UUID_MISSING - required parameter `transactionUUID` missing
* CUSTOMER_NAME_MISSING - required parameter `customerName` missing
* CARD_NOT_FOUND - can not find card by `cardNumber`
* CARD_ALREADY_REPLACED - card with `cardNumber` has already been replaced
* TRANSACTION_NOT_FOUND - can not find transaction by `transactionUUID`
* CUSTOMER_NOT_FOUND - can not find customer by `customerNumber` 
* CARD_NOT_VALID - card `cardNumber` is not valid
* INVALID_AMOUNT - invalid (integer) value for `amount` parameter
* INVALID_CUSTOMER_NUMBER - invalid value for `customerNumber` parameter
* LIMIT_EXCEEDED - `amount` exceeds the limit on card with `cardNumber` or `givenAmount` exceeds the limit in room with `roomNumber`
* CREDITING_NOT_ALLOWED - crediting not allowed on card with `cardNumber`
* TRANSACTION_ALREADY_CANCELLED - transaction with `transactionUUID` is already cancelled
* CARD_ALREADY_REGISTERED - card with `cardNumber` is already registered
* CUSTOMER_ALREADY_REGISTERED - customer with `customerNumber` is already registered
* ROOM_NOT_FOUND - can not find room by `roomNumber`

 
## Server status codes 

* 200 - OK
* 400 - bad request
* 401 - not authorized
* 404 - not found
* 500 - internal server error
