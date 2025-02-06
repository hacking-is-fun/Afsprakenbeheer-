document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded with JavaScript');
    console.log('Checking authentication...');

    // Controleer of de gebruiker geauthenticeerd is
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                console.log('User is authenticated:', data.user.username);
                console.log('User rights:', data.user.rechten);

                // Controleer of de gebruiker de juiste rechten heeft (bijv. 5)
                if (data.user.rechten !== 5) {
                    console.log('User does not have the required rights.');
                    window.location.href = '/index.html';  // Redirect naar login als niet geautoriseerd
                } else {
                    console.log('User has the required rights.');
                    document.getElementById('usernameCorner').innerText = `welkom: ${data.user.username}`;
                    
                    // Haal alle gebruikers op uit de database
                    fetch('/users')
                        .then(response => response.json())
                        .then(users => {
                            // Toon de gebruikers in de agenda
                            const agendaDiv = document.querySelector('.agenda');
                            agendaDiv.innerHTML = '';  // Leegmaken voordat we vullen

                            users.forEach(user => {
                                const userDiv = document.createElement('div');
                                userDiv.classList.add('user-item');

                                // Maak een select-menu voor het wijzigen van rechten
                                const select = document.createElement('select');
                                select.innerHTML = ` 
                                    <option value="1" ${user.rechten == 1 ? 'selected' : ''}>Gebruiker</option>
                                    <option value="2" ${user.rechten == 2 ? 'selected' : ''}>Moderator</option>
                                    <option value="3" ${user.rechten == 3 ? 'selected' : ''}>Admin</option>
                                    <option value="4" ${user.rechten == 4 ? 'selected' : ''}>Superadmin</option>
                                    <option value="5" ${user.rechten == 5 ? 'selected' : ''}>Eigenaar</option>
                                `;

                                // Voeg event listener toe voor wijzigingen in de rechten
                                select.addEventListener('change', function () {
                                    const selectedRight = select.value;  // De nieuwe waarde van de rechten
                                    const userId = user.id;  // De id van de gebruiker

                                    // Stuur de update naar de server
                                    fetch('/update-rights', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ id: userId, rechten: selectedRight })
                                    })
                                    .then(res => res.json())
                                    .then(data => {
                                        console.log('User rights updated:', data);
                                    })
                                    .catch(err => {
                                        console.error('Error updating rights:', err);
                                    });
                                });

                                // Voeg de naam en de select toe aan het userDiv
                                userDiv.innerHTML = `<p>${user.username}</p>`;
                                userDiv.appendChild(select);
                                agendaDiv.appendChild(userDiv);
                                userDiv.classList.add('pp');
                               
                            });
                        })
                        .catch(error => {
                            console.error('Error fetching users:', error);
                        });
                }
            } else {
                console.log('User is not authenticated');
                window.location.href = '/index.html';  // Redirect naar login als niet geauthenticeerd
            }
        })
        .catch(error => {
            console.error('Error during authentication check:', error);
            window.location.href = '/index.html';  // Redirect naar login als er een fout is
        });
});
