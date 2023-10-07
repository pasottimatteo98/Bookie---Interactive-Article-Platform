function follow_article(id_article){
    console.log(id_article);
    axios.post('/follow_article', {
        id: id_article,
    })
    .then(function (response) {
        $("#error").html('<div class="alert alert-success text-center" role="alert">L\'articolo è stato inserito nei seguiti</div>');
    })
    .catch(function (error) {
        if (error.response.status == 500) {
            $("#error").html('<div class="alert alert-danger text-center" role="alert">' + error.response.data.error + '</div>');
        }
    })
}

function favorite_episode(id_episode){
    console.log(id_episode);
    axios.post('/favorite_episode', {
        id: id_episode,
    })
    .then(function (response) {
        $("#error").html('<div class="alert alert-success text-center" role="alert">L\'episodio è stato inserito nei preferiti</div>');
    })
    .catch(function (error) {
        if (error.response.status == 500) {
            $("#error").html('<div class="alert alert-danger text-center" role="alert">' + error.response.data.error + '</div>');
        }
    })
}