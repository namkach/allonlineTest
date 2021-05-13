describe('Login page', () => {
    const testDatas = require("../../fixtures/products.json")
    const loginUsername = Cypress.env('loginUsername')
    const loginPassword = Cypress.env('loginPassword')
    const username = Cypress.env('username')

    function formatNumber (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

    beforeEach('Login', function() {
        cy.visit('https://integ1.allonline.7eleven.co.th/')
        cy.title().should('eq', '7Online') 
        // cy.login(loginUsername, loginPassword, username)
    })

    // afterEach('Logout', function() {
    //     cy.visit('/')
    //     cy.login(loginUsername, loginPassword, username, true)
    //     cy.wait(1000)
    //     cy.get('a.logo[href="/"]')
    //         .click({force : true})
    //     cy.logout(username)
    // })

    it.only('Test CircleCI : purchase.js', () => {
        cy.log('Hello world!, this is a CircleCI test for purchase.js')
    })

    testDatas.forEach((testData) => {   
        const customerName = testData.customerDetails.customerName
        const phoneNumber = testData.customerDetails.customerPhone
        const products = testData.products
        const shippingType = testData.shippingType
        const taxInvoice = testData.taxInvoiceDetails
        const searchAddrType = testData.searchAddressType
        const storeId = testData.storeDetails.storeId
        const storeName = testData.storeDetails.storeName
        const storeAddress = testData.storeDetails.storeAddress
        const paymentDetails = testData.paymentDetails
        const promotion = testData.discount.promotion
        const discountAMBPoint = testData.discount.amb
        var discountAMBBath = parseInt(discountAMBPoint / 100)
        const discountMstamp = testData.discount.mstamp
        const splitOrderDetails = testData.splitOrderDetails
        var shippingFee = testData.shippingFee
        const isReLogin = true
        var haveSplitOrder = false
        var customerDetails = ''
        var address = ''
        var splitOrderAmount = 0
        var splitAddressPayment = ''
        var searchSplitAddressType = ''
        var orderSum = 0
        var productList = 0
        var productSplitList = 0
        var sum = 0
        var price = ''
        var productPrice = 0
        var totalPrice = 0
        var amb = 0
        var mstamp = 0
        var discount = 0 
        var priceAMB = 0
        var priceMStamp = 0
        var freeList = 0
        var qty = 0

        it('purchase products | ' + testData.description, () => { 
            // check remaining product in basket
            cy.get('span.cart-indicator').then( ($cartIndicator) => {
                var num = parseInt($cartIndicator.text().replace(/,/g, '')) || 0
                if (num > 0) {
                    cy.clearBasket()
                }
            })

            if(promotion.usePromotion && promotion.searchType == 'myCoupon') {
            // if(promotion.usePromotion) {
                cy.get('a[href="/coupon/"]')
                    .should('contain', 'คูปองส่วนลด')
                    .click()
                cy.title().should('eq', 'Coupon | AllOnline')
                cy.url().should('include', '/coupon/')

                var iscated = false
                cy.findCoupon(promotion.id, iscated)
                // cy.checkCoupon(promotion) 
                cy.getCoupon(promotion.id)
            }

            // add product to basket
            products.forEach((product) => {
                cy.searchProduct(product)
                cy.addProduct(product)

                cy.wait(1000)
                qty += product.amount
                cy.get('.cart-indicator')
                    .should('contain', qty)
                if (product.isSplit == 'Y') {
                    haveSplitOrder = true
                    splitOrderAmount--
                }                    
            })

            // check shipping address
            if ( shippingType == 'รับที่เซเว่นอีเลฟเว่น') {
                customerDetails = {
                    "phoneNumber" : phoneNumber, 
                    "storeId" : storeId, 
                    "storeAddress" : storeAddress,
                    "storeName" : storeName
                }
                address = storeAddress
                if (haveSplitOrder) {
                    searchSplitAddressType = testData.splitOrderDetails.splitAddressType
                    splitAddressPayment = splitOrderDetails.addressNo + ' ' + 
                    splitOrderDetails.floor + ', ' + 
                    splitOrderDetails.moo + ', ' + 
                    splitOrderDetails.soi + ', ' + 
                    splitOrderDetails.street + ', ' + 
                    splitOrderDetails.subDistrict + ' ' + 
                    splitOrderDetails.district + ' ' + 
                    splitOrderDetails.province + ' ' + 
                    splitOrderDetails.postalCode
                }                    
            } else if (shippingType == 'จัดส่งตามที่อยู่') {
                customerDetails = testData.customerDetails
                address = customerDetails.addressNo + ' ' + 
                    customerDetails.floor + ', ' + 
                    customerDetails.moo + ', ' + 
                    customerDetails.soi + ', ' + 
                    customerDetails.street + ', ' + 
                    customerDetails.subDistrict + ' ' + 
                    customerDetails.district + ' ' + 
                    customerDetails.province + ' ' + 
                    customerDetails.postalCode
                haveSplitOrder = false
            }
            
            // check product in pop up basket
            cy.wait(2000)  
            cy.get('#mini-basket')
                    .should('contain', 'ตะกร้าสินค้า')
                    .click()
            products.forEach((product) => {
                // price = formatNumber(product.amount * product.price)
                cy.verifyPopUpBasket(product, productList)
                orderSum += product.amount * product.price
                productList++
            })
            sum = formatNumber(orderSum)
            cy.get('.item-sum').should('contain', sum)
            cy.get('#mini-basket')
                    .should('contain', 'ตะกร้าสินค้า')
                    .click()

            cy.title().should('eq', 'AllOnline')
            cy.url().should('include', '/account/basket/')
            productList = 1
            products.forEach((product) => {
                // price = formatNumber(product.amount * product.price)
                // productPrice = formatNumber(product.price)
                cy.verifyBasket(product, productList)
                productList++
            }) 
            cy.contains('ดำเนินการชำระเงิน')
                .click()

            // shipping
            cy.url().should('include', '/checkout/shipping/')
            cy.title().should('eq', 'การจัดส่ง')

            cy.verifyShipping(shippingType, searchAddrType, customerDetails, taxInvoice)

            productList = 1
            productSplitList = 1
            products.forEach((product) => {
                if (product.isSplit == 'Y' && haveSplitOrder) {
                    cy.verifyOrder(product, productSplitList, haveSplitOrder)
                    productSplitList++
                } else {
                    cy.verifyOrder(product, productList, haveSplitOrder)
                    productList++
                }                    
            })

            if (haveSplitOrder) {
                cy.verifyShipping('จัดส่งตามที่อยู่', searchSplitAddressType, splitOrderDetails, taxInvoice, haveSplitOrder)
            }

            cy.get('button[id="continue-payment-btn"]').contains('ดำเนินการชำระเงิน')
                .click()

            // payment
            cy.url().should('include', '/checkout/payment/')
            cy.title().should('eq', 'ชำระเงิน')

            cy.get('.basket').should(($basket) => {
                expect($basket).to.contain('สรุปรายการสั่งซื้อ')
                expect($basket).to.contain(products.length + ' สินค้า')
                expect($basket).to.contain(customerName)
            })
            switch(shippingType) {
                case 'รับที่เซเว่นอีเลฟเว่น' :
                    if (haveSplitOrder) {
                        cy.get('.address').first().should(($custAddress) => {
                            expect($custAddress).to.contain('เบอร์โทรศัพท์ผู้รับสินค้า: ' + phoneNumber)
                            expect($custAddress).to.contain('เซเว่นอีเลฟเว่น #' + storeId)
                            expect($custAddress).to.contain(storeName)
                            expect($custAddress).to.contain(address)
                        })
                        cy.get('.address').eq(2).should(($custAddress) => {
                            expect($custAddress).to.contain(customerName)
                            expect($custAddress).to.contain('เบอร์โทรติดต่อ : ' + phoneNumber)
                            expect($custAddress).to.contain(splitAddressPayment)
                        })
                    } else {
                        cy.get('.basket').should(($custAddress) => {
                            expect($custAddress).to.contain('เบอร์โทรศัพท์ผู้รับสินค้า: ' + phoneNumber)
                            expect($custAddress).to.contain('เซเว่นอีเลฟเว่น #' + storeId)
                            expect($custAddress).to.contain('สาขา ' + storeName)
                            expect($custAddress).to.contain(address)
                        })
                    }
                    break;
                case 'จัดส่งตามที่อยู่' :
                    cy.get('.basket').should(($custAddress) => {
                        expect($custAddress).to.contain('เบอร์โทรติดต่อ : ' + phoneNumber)
                        expect($custAddress).to.contain(address)
                    })
                    break;
            }

            orderSum = 0
            productList = 0
            products.forEach((product) => {
                // price = formatNumber(product.amount * product.price)
                if (haveSplitOrder && product.isSplit == 'Y') {
                    cy.verifyOrderAtPayment(product, splitOrderAmount)
                    splitOrderAmount++
                } else {
                    cy.verifyOrderAtPayment(product, productList)
                    productList++
                }

                if (product.getAMB) {
                    priceAMB += product.price * product.amount
                }

                switch (product.mstampType) {
                    case 'normalRate' :
                        priceMStamp += product.price * product.amount
                }
                orderSum += product.amount * product.price
            })

            if(promotion.usePromotion) {
                cy.typePromotion(promotion)
                cy.visit('/')
                cy.login(loginUsername, loginPassword, username, isReLogin)
                
                cy.wait(2000)
                cy.get('#mini-basket')
                    .should('contain', 'ตะกร้าสินค้า')
                    .dblclick()
                cy.get('a.proceed')
                    .should('contain', 'ดำเนินการชำระเงิน')
                    .click()

                // shipping
                cy.verifyShipping(shippingType, searchAddrType, customerDetails, taxInvoice)        
                if (haveSplitOrder) {
                    cy.verifyShipping('จัดส่งตามที่อยู่', searchSplitAddressType, splitOrderDetails, taxInvoice, haveSplitOrder)
                }
                cy.get('button[id="continue-payment-btn"]').contains('ดำเนินการชำระเงิน')
                    .click()

                cy.wait(2000)

                cy.checkPromotion(promotion)
                // calculate promotion
                var promotionPrice = 0
                var haveProducts = false

                if (promotion.type == '') {
                    promotionPrice = orderSum
                } else {
                    products.forEach((product) => {
                        if (promotion.type == product.type) {
                            promotionPrice += (product.price * product.amount)
                            haveProducts = true
                        }
                    })
                }                    

                if (promotionPrice >= promotion.minimum) {
                    switch (promotion.discountType) {
                        case 'percentage' : 
                            promotionPrice = parseInt(promotionPrice * (promotion.discountAmount / 100))
                            if (promotion.maxDiscount > 0 && promotionPrice >= promotion.maxDiscount) {
                                discount = promotion.maxDiscount
                            } else {
                                discount = promotionPrice
                            }
                            cy.get('tr.line-coupon')
                                .should('contain', promotion.id.toUpperCase())
                            break;
                        case 'fixed-amount' :
                            cy.log('promotionPrice : ' + promotionPrice)
                            cy.log('promotion.discountAmount : ' + promotion.discountAmount)
                            if (promotionPrice >= promotion.discountAmount) {
                                discount = promotion.discountAmount
                            } else {
                                discount = promotionPrice
                            }
                            cy.log('discount : ' + discount)                                
                            cy.get('tr.line-coupon')
                                .should('contain', promotion.id.toUpperCase())                            
                            break;
                        case 'free-shipping' : 
                            if (haveProducts == true) {
                                shippingFee = 0
                                cy.get('tr.line-coupon')
                                    .should('contain', promotion.id.toUpperCase())
                            }
                            break; 
                        case 'free-item' : 
                            if (haveProducts == true) {
                                cy.get('#tbody-free-item > .radio-styled > .show-description').first()
                                    .should('contain', promotion.freeProduct)
                                cy.get('#tbody-free-item > .radio-styled > [align="center"]').first()
                                    .should('contain', promotion.freeQty)
                            }
                            break;
                    }
                }                                      
            }

            if (discountAMBPoint > 0) {
                cy.discountAMB(discountAMBPoint, formatNumber(discountAMBBath))
            }

            if (discountMstamp > 0) {
                cy.discountMstamp(discountMstamp)
            }
            
            // check promotion on product
            products.forEach((product) => {
                if (product.promotion.hasPromotion) {
                    if (promotion.usePromotion && promotion.discountType == 'free-item') {
                        freeList++
                    }
                    product.promotion.details.forEach((detail) => {
                        switch (detail.type) {
                            case 'freePerProduct' : 
                                cy.get('.items.radio-styled > .show-description').eq(freeList)
                                    .should('contain', detail.name)
                                qty = product.amount * detail.qty
                                cy.get('.items.radio-styled > [align="center"]').eq(freeList)
                                    .should('contain', qty)
                                break;
                            case 'fixedAmount' :
                                cy.get('.items.radio-styled > .show-description').eq(freeList)
                                    .should('contain', detail.name)
                                cy.get('.items.radio-styled > [align="center"]').eq(freeList)
                                    .should('contain', detail.qty)
                                break;
                            case 'amb' : 
                                amb += detail.qty 
                                break;
                            case 'ambPerAmount' :
                                qty = parseInt(product.amount / detail.amount)
                                amb += detail.qty * qty
                        }
                        freeList++ 
                    })                       
                }
            })

            sum = formatNumber(orderSum)
            totalPrice = orderSum + shippingFee - discount - discountAMBBath - discountMstamp
            amb += parseInt((priceAMB - discount - discountAMBBath - discountMstamp) / 10) * 3

            mstamp = parseInt((priceMStamp - discount - discountAMBBath - discountMstamp) / 50)

            cy.verifyTotalPrice(sum, formatNumber(shippingFee), formatNumber(totalPrice), amb, mstamp, discount, promotion.usePromotion, discountAMBBath, discountMstamp)
            cy.payment(paymentDetails)
            cy.checkReceipt(paymentDetails, customerName, formatNumber(totalPrice.toFixed(2)))

            switch (paymentDetails.paymentType) {
                case 'PAYATALL_CC' : 
                case 'PAYATALL_TMN' : 
                    cy.get('.message-order-barcode')
                        .then(($text) => {
                            var text = $text.text()
                            var words = text.trim().split(" ")
                            var orderNo = words[1]
                            cy.wrap(orderNo).as('orderNo')
                        })
                    break;
                case 'PAYATALL_CS' : 
                    cy.contains('เลขที่ใบแจ้งสินค้า/Invoice No:')
                        .siblings('.detail-table-right')
                        .then(($orderNo) => {
                            var orderNo = $orderNo.text()
                            cy.wrap(orderNo).as('orderNo')
                        }) 
                    cy.visit('/')
                    cy.login(loginUsername, loginPassword, username, isReLogin)
                    break;
            }
            cy.get('@orderNo')
                .then(orderNo => {
                    if (!haveSplitOrder) {
                        cy.checkStatusOrder(orderNo)
                    } else {
                        var orderLength = orderNo.length
                        for(let i = 1; i <= 2; i++) {
                            orderNo = orderNo.substring(0, orderLength - 2) + i + orderNo.substring(orderLength - 1)
                            cy.checkStatusOrder(orderNo)
                        }
                    }
                }) 
            if(paymentDetails.paymentType != 'PAYATALL_CS') {
                cy.checkAMB(customerName, amb)
            }             
                
        })  
    })
    
    
})