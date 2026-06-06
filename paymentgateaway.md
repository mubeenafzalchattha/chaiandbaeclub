
curl --request POST \
  --url https://api-v2.ziina.com/api/payment_intent \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '
{
  "amount": 123,
  "currency_code": "<string>",
  "message": "<string>",
  "success_url": "<string>",
  "cancel_url": "<string>",
  "failure_url": "<string>",
  "test": true,
  "expiry": "<string>",
  "allow_tips": false
}
'


curl --request POST \
  --url https://api-v2.ziina.com/api/webhook \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '
{
  "url": "<string>",
  "secret": "<string>"
}
'