curl 'https://vroom.predictivemovement.se/' \
  -H 'Content-type: application/json' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36' \
  --data-raw '{"jobs":[{"id":1,"description":"Sverige","location":[23.184821605682377,66.8735206250344]},{"id":2,"description":"Kaivotie, Pello","location":[23.959357738494877,66.77082419640324]},{"id":3,"description":"99","location":[23.791816234588627,66.9865279205176]}],"shipments":[],"vehicles":[{"id":1,"start":[23.3647298,67.2090363],"startDescription":"Pajala","end":[22.091875076293945,65.59281435905004],"endDescription":"Karlsvik"}],"options":{"g":true}}' \
