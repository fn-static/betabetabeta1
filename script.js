document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("productModal");
    const modalImage = document.getElementById("modalImage");
    const modalText = document.getElementById("modalText");
    const closeModal = document.querySelector(".close");
    const addToCartButton = document.getElementById("addToCartButton");
    const quantityInput = document.getElementById("quantityInput");
    const cartButton = document.getElementById("cartButton");
    const cartContent = document.getElementById("cartContent");
    const checkoutButton = document.getElementById("checkoutButton");
    const orderModal = document.getElementById("orderModal");
    const closeOrderModal = orderModal.querySelector(".close");
    const paypalAmountInput = document.getElementById("paypalAmount");
    const paypalItemNameInput = document.getElementById("paypalItemName");
    const stripePayButton = document.getElementById('stripePayButton');
    const stripe = Stripe('pk_live_51Pb86nEwxRR5jgDum9x9Mr1tgAJz1BIqQMWYDiXZ2HHUhWQfP6j4k92DYiOihrGGqrOXqIVeAcSLzdQQYGtL6gCv00A9birhfS'); // Zastąp swoim kluczem publicznym Stripe

    let currentProductId = null;
    let currentPrice = 0;
    let cartItems = [];
    let totalAmount = 0;

    // Ustawienie cen produktów
    const productPrices = {};
    document.querySelectorAll(".product-item").forEach(item => {
        const productId = item.getAttribute("data-product");
        const productPrice = parseFloat(item.getAttribute("data-price"));
        productPrices[productId] = productPrice;
    });

    // Funkcja dodająca produkt do koszyka
    function addToCart(productName, quantity, totalPrice) {
        const existingItem = cartItems.find(item => item.name === productName);
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.totalPrice = (existingItem.totalPrice + totalPrice).toFixed(2);
        } else {
            cartItems.push({ name: productName, quantity, totalPrice });
        }
        updateCart();
    }

    // Funkcja aktualizująca koszyk
    function updateCart() {
        const cartItemsList = document.getElementById("cartItems");
        cartItemsList.innerHTML = ""; // Czyść poprzednie elementy
        totalAmount = 0; // Resetuj łączną kwotę

        cartItems.forEach(item => {
            const listItem = document.createElement("li");
            listItem.textContent = `${item.name} - Ilość: ${item.quantity} - Cena: ${item.totalPrice} PLN`;
            cartItemsList.appendChild(listItem);
            
            // Dodaj do łącznej kwoty
            totalAmount += parseFloat(item.totalPrice);
        });

        // Aktualizuj tekst przycisku "Zamów"
        if (checkoutButton) {
            checkoutButton.textContent = `Zamów - ${totalAmount.toFixed(2)} PLN`;
        }

        // Ustaw wartość ukrytego pola totalAmount w formularzu PayPal
        if (paypalAmountInput) {
            paypalAmountInput.value = totalAmount.toFixed(2);
        }
    }

    // Obsługuje kliknięcia na produkty
    document.querySelectorAll(".product-item").forEach(item => {
        item.addEventListener('click', function() {
            const productId = this.getAttribute('data-product');
            currentPrice = productPrices[productId]; // Ustaw cenę na podstawie wybranego produktu
            currentProductId = productId; 

            // Ustaw odpowiednie dane w modalu
            if (modalImage && modalText) {
                modalImage.src = `product${currentProductId}.jpg`;
                modalText.textContent = `Produkt ${currentProductId}`;
            }

            // Pokaż modal
            modal.classList.remove("hidden");
        });
    });

    // Obsługuje zamykanie modalu
    if (closeModal) {
        closeModal.addEventListener("click", function() {
            modal.classList.add("hidden");
        });
    }

    // Dodanie produktu do koszyka
    if (addToCartButton) {
        addToCartButton.addEventListener("click", function() {
            const selectedQuantity = parseInt(quantityInput.value, 10);
            const totalPrice = (currentPrice * selectedQuantity).toFixed(2); // Oblicz całkowitą cenę

            // Dodaj produkt do koszyka
            addToCart(modalText.textContent, selectedQuantity, totalPrice);

            alert(`Dodano do koszyka: ${modalText.textContent}, Ilość: ${selectedQuantity}, Cena: ${totalPrice} PLN`);
            
            // Ukryj modal
            modal.classList.add("hidden");
        });
    }

    // Obsługuje przycisk "Koszyk"
    if (cartButton) {
        cartButton.addEventListener('click', function() {
            cartContent.classList.toggle('hidden');
        });
    }

    // Obsługuje przycisk "Zamów"
    if (checkoutButton) {
        checkoutButton.addEventListener('click', function() {
            // Ustaw wartości w formularzu PayPal przed otwarciem modalu
            const itemNames = cartItems.map(item => `${item.name} x${item.quantity}`).join(', ');
            if (paypalItemNameInput) {
                paypalItemNameInput.value = itemNames;
            }

            // Otwórz modal zamówienia
            orderModal.classList.remove("hidden");
        });
    }

    // Funkcja do zamykania modalu zamówienia
    if (closeOrderModal) {
        closeOrderModal.addEventListener("click", function() {
            orderModal.classList.add("hidden");
        });
    }

    // Obsługuje kliknięcia przycisków na stronie
    document.getElementById("productsButton").addEventListener("click", function() {
        // Zmniejsz logo i przenieś je na górę ekranu
        document.querySelector("header").classList.add("small");

        // Ukryj przyciski
        document.querySelector(".buttons").style.display = "none";

        // Pokaż produkty
        document.getElementById("products").classList.add("show");

        // Dodaj przycisk powrotu
        addBackButton();
    });

    document.getElementById("contactButton").addEventListener("click", function() {
        // Przekierowanie do linku kontaktowego
        window.location.href = "https://twojalink.com";  // Zastąp "https://twojalink.com" właściwym linkiem
    });

    // Funkcja dodająca przycisk powrotu
    function addBackButton() {
        if (!document.getElementById('backButton')) {
            const backButton = document.createElement('button');
            backButton.id = 'backButton';
            backButton.textContent = 'Powrót';
            document.body.appendChild(backButton);

            backButton.addEventListener('click', function() {
                document.querySelector('header').classList.remove('small');
                document.querySelector('.buttons').style.display = 'flex';
                document.getElementById('products').classList.remove('show');
                document.getElementById('backButton').remove();
            });
        }
    }

    // Obsługuje kliknięcia przycisku "Zapłać kartą"
    if (stripePayButton) {
        stripePayButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: totalAmount
                    })
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }

                const { clientSecret } = await response.json();

                const { error } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: {
                            // Wprowadź dane karty
                        }
                    }
                });

                if (error) {
                    alert('Płatność nie powiodła się: ' + error.message);
                } else {
                    alert('Płatność zakończona pomyślnie.');
                }
            } catch (error) {
                alert('Wystąpił błąd: ' + error.message);
            }
        });
    }
});
