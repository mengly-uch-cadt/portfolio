<template>
    <form id="contact-form" class="text-sm">
        <div class="flex flex-col">
            <label for="name" class="mb-3">_name:</label>
            <input type="text" id="name-input" name="name" :placeholder="name" class="p-2 mb-5 placeholder-slate-600" required>
        </div>
        <div class="flex flex-col">
            <label for="email" class="mb-3">_email:</label>
            <input type="email" id="email-input" name="email" :placeholder="email" class="p-2 mb-5 placeholder-slate-600" required>
        </div>
        <div class="flex flex-col">
            <label for="message" class="mb-3">_message:</label>
            <textarea id="message-input" name="message" :placeholder="message" class="placeholder-slate-600" required></textarea>
        </div>
        <button id="submit-button" type="submit" class="py-2 px-4">submit-message</button>
    </form>
</template>

<script>
import emailjs from 'emailjs-com';

export default {
    name: 'ContactForm',
    props: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        }
    },
    mounted() {
        document.getElementById("contact-form").addEventListener("submit", function(event) {
            event.preventDefault();
            const name = document.querySelector('input[name="name"]').value;
            const email = document.querySelector('input[name="email"]').value;
            const message = document.querySelector('textarea[name="message"]').value;

            const templateParams = {
                name: name,
                email: email,
                message: message
            };

            // Send the email using EmailJS
            emailjs.send('service_m504z6m', 'template_6md71vm', templateParams, '1MKmuC4-vIGTuoT3K')
            // emailjs.send('service_m504z6m', 'ciwkyvf', templateParams, '1MKmuC4-vIGTuoT3K')
                .then((response) => {
                    console.log('SUCCESS!', response);
                    alert('Message sent successfully!');
                }, (err) => {
                    console.error('FAILED...', err);
                    alert(`Failed to send message: ${err.text}`);
                });
        });
    }
}
</script>

<style scoped>
form {
    @apply font-fira_retina text-menu-text;
}
input {
    background-color: #011221;
    border: 2px solid #1E2D3D;
    border-radius: 7px;
}
input:-webkit-autofill,
textarea:-webkit-autofill,
select:-webkit-autofill {
    -webkit-text-fill-color: rgb(190, 190, 190);
    border: 2px solid #607b96;
}
#message-input {
    background-color: #011221;
    border: 2px solid #1E2D3D;
    border-radius: 7px;
    resize: none;
    height: 150px;
    padding: 10px;
}
#submit-button {
    background-color: #1E2D3D;
    border-radius: 7px;
    margin-top: 20px;
    cursor: pointer;
}
#submit-button:hover {
    background-color: #263B50;
}
input:focus, #message-input:focus {
    outline: none;
    border: 2px solid #607b96;
    box-shadow: #607b9669 0px 0px 0px 2px;
}
#contact-form {
    max-width: 370px;
    width: 100%;
}
</style>
