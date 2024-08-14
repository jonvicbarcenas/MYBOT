document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('configForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const cookieData = document.getElementById('cookieData').value;

        // Prepare the data to send to the server
        const dataToSend = {};
        if (email) dataToSend.email = email;
        if (password) dataToSend.password = password;
        if (cookieData) dataToSend.cookieData = cookieData;

        // Log the data to be sent
        console.log('Data to send:', dataToSend);

        try {
            const response = await fetch('/update-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            // Log the raw response object
            console.log('Response:', response);

            const result = await response.json();

            // Log the result received from the server
            console.log('Result:', result);

            alert(result.message);
        } catch (error) {
            // Log any errors that occur during the fetch operation
            console.error('Error:', error);
            alert('An error occurred while updating the configuration.');
        }
    });
});
