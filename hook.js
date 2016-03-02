module['exports'] = function echoHttp (hook) {

  var store = hook.datastore,
        res = hook.res,
        dataAmount = parseInt(hook.params.data);

  if (!dataAmount) return res.status(400).json({error:'missing data amount'});
  if (data > 1000) return res.status(400).json({error:'invalid value'});
  if (data < 10)    return res.status(400).json({error:'invalid value'});

  store.set('vaskTrafik', { dataAmount: dataAmount, nrOfUsers:1 }, function(err, result){
    res.end(result);
  });
}


