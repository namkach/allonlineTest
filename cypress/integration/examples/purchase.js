describe('Login page', () => {
    // const testDatas = require("../../fixtures/e.json")
    const testDatas = require("../../fixtures/products.json")
    // const testDatas = require("../../fixtures/recentStore_CS.json")
    const loginUsername = Cypress.env('loginUsername')
    const loginPassword = Cypress.env('loginPassword')
    const username = Cypress.env('username')

    function formatNumber (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

    beforeEach('Login', function() {
        cy.visit('https://integ1.allonline.7eleven.co.th/')
        cy.title().should('eq', '7Online') 
        cy.login(loginUsername, loginPassword, username)
    })

    afterEach('Logout', function() {
        cy.get('a.logo[href="/"]')
            .click({force : true})
        cy.logout(username)
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
        const discountAMBBath = discountAMBPoint / 100
        const discountMstamp = testData.discount.mstamp
        const splitOrderDetails = testData.splitOrderDetails
        var shippingFee = testData.shippingFee
        const isReLogin = 'Y'
        var haveSplitOrder = false
        var customerDetails = ''
        var address = ''
        var splitAddress = ''
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
        var earnAMB = 0

        it.skip('purchase products | ' + testData.description, () => {      
            cy.get('a.all-member-points-header > span').then( ($ownAMB) => {
                var ownAMB = parseInt($ownAMB.text().replace(/,/g, ''))
                cy.log('ownAMB : ' + ownAMB)
                cy.log('before check haveSplitOrder : ' + haveSplitOrder)
                cy.log('shippingType : ' + shippingType)

                // check remaining product in basket
                cy.get('span.cart-indicator').then( ($cartIndicator) => {
                    var num = parseInt($cartIndicator.text().replace(/,/g, '')) || 0
                    cy.log('num cartIndicator : ' + num)
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
                    cy.log('promotion.code : ' + promotion.code)
                    cy.findCoupon(promotion.code, iscated)
                    cy.checkCoupon(promotion) 
                    cy.getCoupon(promotion.code)
                }

                // add product to basket
                products.forEach((product) => {
                    price = formatNumber(product.price)
                    cy.searchProduct(product)
                    cy.addProduct(product, price)

                    cy.wait(1000)
                    qty += product.amount
                    cy.log('qty : ' + qty)
                    cy.get('.cart-indicator')
                        .should('contain', qty)
                    if (product.isSplit == 'Y') {
                        haveSplitOrder = true
                        splitOrderAmount--
                    }                    
                })
                cy.log('after check haveSplitOrder : ' + haveSplitOrder)

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
                        cy.log('splitAddressPayment : ' + splitAddressPayment)
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
                
                cy.log('check shipping Type : ' + shippingType)
                cy.log('check split order : ' + haveSplitOrder)
                

                // check product in pop up basket
                cy.wait(2000)  
                // cy.get('#mini-basket', { timeout: 20000 })
                cy.get('#mini-basket')
                        .should('contain', 'ตะกร้าสินค้า')
                        .click()
                // cy.contains('ตะกร้าสินค้า', { timeout: 20000 })
                //     .click()
                products.forEach((product) => {
                    price = formatNumber(product.amount * product.price)
                    cy.log('price : ' + price)
                    cy.verifyPopUpBasket(product.name, product.amount, price, productList)
                    orderSum += product.amount * product.price
                    cy.log('orderSum : ' + orderSum)
                    productList++
                })
                sum = formatNumber(orderSum)
                // cy.get('.item-sum', { timeout: 20000 }).should('contain', sum)
                cy.get('.item-sum').should('contain', sum)

                // cy.get('#mini-basket', { timeout: 20000 })
                cy.get('#mini-basket')
                        .should('contain', 'ตะกร้าสินค้า')
                        .click()
                // cy.contains('ตะกร้าสินค้า')
                //     .click()
                cy.title().should('eq', 'AllOnline')
                cy.url().should('include', '/account/basket/')
                productList = 1
                products.forEach((product) => {
                    price = formatNumber(product.amount * product.price)
                    productPrice = formatNumber(product.price)
                    cy.verifyBasket(product.name, product.barcode, product.amount, productPrice, price, productList)
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
                    cy.log('haveSplitOrder : ' + haveSplitOrder)
                    if (product.isSplit == 'Y' && haveSplitOrder) {
                        cy.verifyOrder(product.name, product.barcode, productSplitList, product.isSplit, haveSplitOrder)
                        productSplitList++
                    } else {
                        cy.verifyOrder(product.name, product.barcode, productList, product.isSplit, haveSplitOrder)
                        productList++
                    }                    
                })

                if (haveSplitOrder) {
                    cy.verifyShipping('จัดส่งตามที่อยู่', searchSplitAddressType, splitOrderDetails, taxInvoice, haveSplitOrder)
                }

                cy.get('button[id="continue-payment-btn"]').contains('ดำเนินการชำระเงิน')
                    .click()

                // // payment
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
                    price = formatNumber(product.amount * product.price)
                    if (haveSplitOrder && product.isSplit == 'Y') {
                        cy.log('haveSplitOrder + isSplit = Y')
                        cy.verifyOrderAtPayment(product, price, splitOrderAmount)
                        splitOrderAmount++
                    } else {
                        cy.verifyOrderAtPayment(product, price, productList)
                        productList++
                    }
                    if (product.getAMB) {
                        priceAMB += product.price * product.amount
                        cy.log('priceAMB : ' + priceAMB)
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
                    // cy.get('a.coupon-reset', { timeout: 10000 }).should('be.visible')

                    cy.checkPromotion(promotion)

                    // cy.get('a.coupon-reset').should('be.visible')
                    //     .and('have.attr', 'data-promo-code', promotion.code)
                    // if (promotion.description != "") {
                    //     cy.get('ul.promotions')
                    //         .should('contain', promotion.description)
                    // }            

                    // calculate promotion
                    var promotionPrice = 0
                    var haveProducts = false

                    if (promotion.productType == '') {
                        promotionPrice = orderSum
                        cy.log('promotionPrice : ' + promotionPrice)
                    } else {
                        products.forEach((product) => {
                            if (promotion.productType == product.type) {
                                promotionPrice += (product.price * product.amount)
                                cy.log('promotionPrice : ' + promotionPrice)
                                haveProducts = true
                            }
                        })
                    }                    
                    cy.log('promotionPrice : ' + promotionPrice)

                    cy.log('promotion.discountType : ' + promotion.discountType)
                    if (promotionPrice >= promotion.minimum) {
                        switch (promotion.discountType) {
                            case 'percentage' : 
                                promotionPrice = parseInt(promotionPrice * (promotion.discountAmount / 100))
                                if (promotionPrice >= promotion.maxDiscount) {
                                    discount = promotion.maxDiscount
                                } else {
                                    discount = promotionPrice
                                }
                                cy.get('tr.line-coupon')
                                    .should('contain', promotion.code.toUpperCase())
                                cy.log('discount : ' + discount)
                                break;
                            case 'fixedAmount' :
                                if (promotionPrice >= promotion.discountAmount) {
                                    discount = promotion.discountAmount
                                } else {
                                    discount = promotionPrice
                                }                                
                                cy.get('tr.line-coupon')
                                    .should('contain', promotion.code.toUpperCase())                            
                                break;
                            case 'freeShipping' : 
                                if (haveProducts == true) {
                                    shippingFee = 0
                                    cy.get('tr.line-coupon')
                                        .should('contain', promotion.code.toUpperCase())
                                }
                                break; 
                            case 'freeProduct' : 
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
                    // cy.get('input#allpoint-burn')
                    //     .type(discountAMBPoint)
                    // cy.get('.allmember-burn-section-submit-in-progress-enable')
                    //     .should('have.class', 'active')
                    //     .click()
                    // cy.get('#current-amount > .current-discount')
                    //     .should('contain', 'B ' + formatNumber(discountAMBBath))
                }

                if (discountMstamp > 0) {
                    cy.discountMstamp(discountMstamp)
                    // cy.get('input#mstamp-burn')
                    //     .type(discountMstamp)
                    // cy.get('.mstamp-burn-section-submit-in-progress-enable')
                    //     .should('have.class', 'active')
                    //     .click()
                    // cy.get('#current-amount-stamp > .current-discount')
                    //     .should('contain', 'B ' + formatNumber(discountMstamp))
                }
                
                // check promotion on product
                products.forEach((product) => {
                    if (product.promotion.hasPromotion) {
                        if (promotion.usePromotion && promotion.discountType == 'freeProduct') {
                            freeList++
                        }
                        cy.get('.items.radio-styled > .show-description').eq(freeList)
                            .should('contain', product.promotion.name)
                        switch (product.promotion.productType) {
                            case 'freePerProduct' : 
                            qty = 0
                            cy.log('product.amount : ' + product.amount)
                            cy.log('product.promotion.qty : ' + product.promotion.qty)
                            qty = product.amount * product.promotion.qty
                                cy.get('.items.radio-styled > [align="center"]').eq(freeList)
                                    .should('contain', qty)
                                break;
                        }                        
                    }
                })

                cy.log('discount : ' + discount)
                sum = formatNumber(orderSum)
                totalPrice = orderSum + shippingFee - discount - discountAMBBath - discountMstamp
                amb = parseInt((priceAMB - discount - discountAMBBath - discountMstamp) / 10) * 3

                mstamp = parseInt((priceMStamp - discount - discountAMBBath - discountMstamp) / 50)

                cy.verifyTotalPrice(sum, formatNumber(shippingFee), formatNumber(totalPrice), amb, mstamp, discount, promotion.usePromotion, discountAMBBath, discountMstamp)
                cy.payment(paymentDetails)
                cy.checkReceipt(paymentDetails, customerName, formatNumber(totalPrice.toFixed(2)))

                cy.contains('เลขที่ใบแจ้งสินค้า/Invoice No:')
                    .siblings('.detail-table-right')
                    .as('orderNo')
                    .then(($orderNo) => {
                        var orderNo = $orderNo.text()
                        cy.log('order number is : ' + orderNo)

                        if(paymentDetails.paymentType == 'PAYATALL_CS') {
                            cy.visit('/')
                            cy.login(loginUsername, loginPassword, username, isReLogin)
                        } else {
                            earnAMB = amb - discountAMBPoint
                            cy.log('ownAMB : ' + ownAMB)
                            cy.log('amb : ' + amb) // totaL amb @payment
                            cy.log('earnAMB : ' + earnAMB) // amb w/ discount amb point
                            cy.checkAMB(customerName, ownAMB, amb, earnAMB)
                        }

                        cy.log('check split order last : ' + haveSplitOrder)
                        if (!haveSplitOrder) {
                            cy.checkStatusOrder(orderNo)
                            cy.log('check split order in if : ' + !haveSplitOrder)
                        } else {
                            var orderLength = orderNo.length
                            // var replaceNumber
                            // cy.log('order length : ' + orderLength)
                            // replaceNumber =  1
                            // orderNo = orderNo.substring(0, orderLength - 2) + replaceNumber + orderNo.substring(orderLength - 1)
                            // cy.log('orderNo : ' + orderNo)
                            // cy.checkStatusOrder(orderNo)
                            // replaceNumber++
                            for(let i = 1; i <= 2; i++) {
                                orderNo = orderNo.substring(0, orderLength - 2) + i + orderNo.substring(orderLength - 1)
                                cy.log('orderNo : ' + orderNo)
                                cy.checkStatusOrder(orderNo)
                            }
                        }
                        
                    })

                
                
            })
        })  
    })
    
    
})