function myDelete(){
   const pageTitle = document.getElementById("ListTitle").innerHTML;
   let selected = [];
   const checked = document.querySelectorAll('input[type="checkbox"]:checked')
   selected = Array.from(checked).map(x => x.value)
   let body = JSON.stringify({task: selected});
   fetch("/remove",
   {method: "post",
   redirect: "follow",
   body: body,
   headers: {
       'Content-Type' : 'application/json' 
   }})
   .then(response => {
    if(response.redirected){
        window.location.href = "/Lists/" + pageTitle;
    }
   })
   .catch(function(err){
    console.info(err);
   });
}

function iDelete(obj){
    const pageTitle = document.getElementById("ListTitle").innerHTML;
    let body = JSON.stringify({task: obj.value});
    fetch("/DeleteItem",
    {method: "post",
    redirect: "follow",
    body: body,
    headers:{
        'Content-Type' : 'application/json'
    }})
    .then(response => {
        if(response.redirected){
            window.location.href = "/Lists/" + pageTitle;
        }
    })
    .catch(function(err){
        console.info(err);
    });
}

var check= function(){
    if(document.getElementById('floatingPassword').value == document.getElementById('floatingConfirmPassword').value){
        document.getElementById('Message').style.color = 'green';
        document.getElementById('Message').innerHTML = 'matching';
        document.getElementById('SignUp').disabled = false;
    }else{
        document.getElementById('Message').style.color = 'red';
        document.getElementById('Message').innerHTML = 'not matching';
        document.getElementById('SignUp').disabled = true;
    }
}