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

exports.ConfirmAccountCreation = function(docs, email){
    let Continue = "True";
    docs.forEach(function(doc){
        if(doc.Email == email){
            Continue = "False";
        }else{
            Continue = "True";
        }
    });
    return Continue;
}

exports.ValidateUser = function(docs, Email, Password){
    let UserEmail = "";
    docs.forEach(function(doc){
        if(doc.Email.toLowerCase() === Email.toLowerCase() && doc.Password === Password){
            UserEmail = Email;
        }
   });
   return UserEmail;
}

exports.ConfirmedEmail = function(docs){
    let confirmedEmail = "false"
    docs.forEach(function(doc){
        if(doc.Status != 'Active'){
            confirmedEmail = "false";
        }else{
            confirmedEmail = "true";
        }
    });
    return confirmedEmail;
}

exports.sendConfirmationEmail = function(name, email, confirmationCode, transport, user, subject, message, link){
    transport.sendMail({
        from: user,
        to: email,
        subject: `${subject}`,
        html: `<h1>${subject}</h1>
        <h2>Hello ${name}</h2>
        <p>${message}</p>
        <a href=https://jeruftodolist.onrender.com/${link}/${confirmationCode}> Click here</a>
        </div>`,
    });
}

exports.AddTaskIntoList = function(Lists, Tasks, page){
    Lists.forEach(function(list){
        if(list.name == page){
            Tasks = list.tasks;
        }
    });
    return Tasks;
}

exports.CheckListExist = function(Lists, NewList){
    let ListExists = "False";
    for(let i = 0; i < Lists.length; i++){
        if(Lists[i].name == NewList){
            ListExists = "True";
            i += Lists.length;
        }else{
            ListExists = "False";
        }
    }
    return ListExists;
}

exports.AddListFromDB = function(){
    // place code from app.js in here
}