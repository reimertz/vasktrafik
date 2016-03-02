module['exports'] = function echoHttp (hook) {
  var store = hook.datastore,
        res = hook.res,
        method = hook.params.method,
        data = parseInt(hook.params.data);

  function error() {
    res.writeHead(400);
    res.json({error:'invalid request'});
  }

  if (!method) {
    error();
  }

  else if(method === 'get') {
    store.get('vaskTrafik', function(err, result){
      res.json(result);
    });
  }

  else if(method === 'post') {
    if (!data || data > 1000 || data < 10){
      error();
    }
    store.get('vaskTrafik', function(err, result){
      if(err) error();

      result.data += data;
      result.nrOfUsers += 1;

      store.set('vaskTrafik', result, function(err, status){
        if(err) error();
        res.json(result);
      });
    });
  }

  else error();
}


