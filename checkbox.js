exports.getCheckedBox = function(res, req){
    let Task = [];
        req.body.checked.forEach(function(check){
            Task.push(allItems[parseInt(check)]);
        });
        return Task;
}