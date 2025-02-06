document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded with JavaScript');
    console.log('Checking authentication...');
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                console.log('User is authenticated:', data.user.username);
                console.log('User rights:', data.user.rechten);
                if (data.user.rechten !== 3 && data.user.rechten !== 4 && data.user.rechten !== 5) {
                    console.log('User does not have the required rights.');
                    window.location.href = '/index.html';
                } else {
                    console.log('User has the required rights.');
                    document.getElementById('usernameCorner').innerText = `welkom: ${data.user.username}`;
                }
            } else {
                console.log('User is not authenticated');
                window.location.href = '/index.html';
            }
        })
        .catch(error => {
            console.error('Error during authentication check:', error);
            window.location.href = '/index.html';
        });
});

//wanneer ik op de knop klik met klas button dan moet die een menu verschijnen
document.querySelector('.button').addEventListener('click', function () {
    document.querySelector('.menu').classList.remove('hide');
    document.querySelector('.menu').classList.add('show');
});
//wanneer ik op de knop met klas close klik dan moet de menu weer verdwijnen
document.querySelector('.close').addEventListener('click', function () {
    document.querySelector('.menu').classList.remove('show');
    document.querySelector('.menu').classList.add('hide');
});