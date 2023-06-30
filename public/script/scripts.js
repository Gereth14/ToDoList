exports.removeItem = function(DeletedTask, Tasks){
    let task = [];
    DeletedTask.forEach(function(deletedtask){
        task.push(deletedtask);
    });
    for(let i = 0; i < Tasks.length; i++){
        for(let q = 0; q < task.length; q++){
            if(task[q] === Tasks[i]){
                Tasks.splice(i, 1);
            }
        }
    }
    return Tasks;
}

exports.deleteItem = function(task, Tasks){
    for(let i = 0; i < Tasks.length; i++){
        if(Tasks[i] === task){
            Tasks.splice(i, 1);
        }
    }
    return Tasks;
}

exports.ValidateUser = function(docs, Email, Password, UserEmail){
   docs.forEach(function(doc){
    if(doc.Email == Email && doc.Password == Password){
        UserEmail = Email;
        
    }
   });
   return UserEmail;
}

exports.AddTaskIntoList = function(Lists, Tasks, page){
    Lists.forEach(function(list){
        if(list.name == page){
            Tasks = list.tasks;
        }
    });
    return Tasks;
}