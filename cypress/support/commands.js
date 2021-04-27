function formatNumber (number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

Cypress.Commands.add('login', (loginUsername, loginPassword, username, reLogin = false) => {
    cy.on('uncaught:exception', (err) => {
        expect(err.message).to.include('something about the error')
        done()
        return false
    })

    cy.get('a.allmember-login').contains('เข้าสู่ระบบ | สมัครสมาชิก')
        .wait(2000)
        .click({force : true})
    
    if (!reLogin) {
        cy.get('input[type="email"]')
            .clear()
            .type(loginUsername, {force: true})
            .should('have.value', loginUsername)
        cy.get('input[type="password"]')
            .clear()
            .type(loginPassword, {force: true})   
            .should('have.value', loginPassword)
        cy.get('a[href="#"]').contains('เข้าสู่ระบบ')
            .click({force: true})
        cy.get('a#login-dropdown')
            .should('contain', username)
    }
})

Cypress.Commands.add('logout', (username) => {
    cy.on('uncaught:exception', (err) => {
        expect(err.message).to.include('something about the error')
        done()
        return false
    })

    cy.get('a#login-dropdown > span.ellipsis-330')
        .should('contain', username)
        .click({force : true})
    cy.get('a.allmember-logout.clean')
        .should('contain', 'ออกจากระบบ')
        .wait(1000)
        .click({force : true})
    cy.wait(10000)
    cy.get('a.allmember-login')
        .should('contain', 'เข้าสู่ระบบ | สมัครสมาชิก')        
}) 

Cypress.Commands.add('clearBasket', () => {
    cy.get('#mini-basket')
            .should('contain', 'ตะกร้าสินค้า')
            .dblclick()
    cy.get('.all-detail-cart-product').then(() => { 
        var num = Cypress.$('.all-detail-cart-product')
        for (let i = 1; i <= num.length; i++) {
            cy.wait(1000)
            cy.get('.format-fav-rem > .remove').first()
                .click({force : true})
            cy.get('.confirmRemove').first()
                .click({force : true})
                .wait(500)
        }
        cy.get('.success')
            .should('contain', 'ตะกร้าของคุณยังว่าง')
        cy.get('li.logo')
            .click()
    })
})

Cypress.Commands.add('addProduct', (product) => {
    cy.get('.currentPrice').should(($currentPrice) => {
        expect($currentPrice).to.contain(formatNumber(product.price))
    })

    cy.get('input[name="order_count"]')
        .clear()
        .type(product.amount)
        .should('have.value', product.amount)
    cy.get('.art-no > [itemprop="sku"]')
        .should('contain', product.barcode)
    if (product.getAMB == false) {
        cy.get('.allmember-content-head ')
            .should('contain', 'สินค้านี้ไม่ร่วมโปรโมชั่น ALL member')
    }

    cy.on('uncaught:exception', (err) => {
        expect(err.message).to.include('something about the error')
        done()
        return false
    })

    cy.contains('เพิ่มลงตะกร้า')
        .click({force: true})
    
    cy.contains('เลือกช้อปต่อ')
        .click({force: true})
})

Cypress.Commands.add('verifyPopUpBasket', (product, productList) => {
    cy.get('div[class="item"][data-index="' + productList + '"] div.description').should(($product) => {
        expect($product).to.contain(product.name)
    })
    
    cy.get('div[class="item"][data-index="' + productList + '"] input[name="order_count"]').should(($product) => {
        expect($product).to.have.value(product.amount)
    })

    var price = formatNumber(product.amount * product.price)
    cy.get('div[class="item"][data-index="' + productList + '"] div[class="price"]').should(($product) => {
        expect($product).to.contain(price)
    })
})

Cypress.Commands.add('verifyBasket', (product,  productList) => {
    cy.get('.title').should(($product) => {
        expect($product).to.contain('รายการที่ ' + productList + ' - ' + product.barcode)
        expect($product).to.contain(product.name)
    })
    cy.get('.price').should(($price) => {
        expect($price).to.contain(formatNumber(product.price))
    })

    var index = productList - 1 
    cy.get('input[name="order_count"][data-itemindex="' + index + '"]')
        .should('have.value', product.amount)

    var price = formatNumber(product.amount * product.price)
    cy.get('.total .highlight').should(($total) => {
        expect($total).to.contain(price)
    })
})

Cypress.Commands.add('verifyShipping', (deliveryType, addrType, customerDetails, taxInvoice, isSplitAddr = 'N') => {
    switch(deliveryType) {
        case 'รับที่เซเว่นอีเลฟเว่น' :
            cy.get('.tab-store')
                .should(($deliType) => {
                    expect($deliType).to.contain(deliveryType)
                })
                .click()
            cy.get('#second-phone-shipping')
                .should('have.attr', 'value', customerDetails.phoneNumber)
            cy.storeSearch(addrType, customerDetails.storeId, customerDetails.storeName)
            break;
        case 'จัดส่งตามที่อยู่' :
            if (isSplitAddr == 'N') {
                cy.get('.tab-address')
                    .should(($deliType) => {
                        expect($deliType).to.contain(deliveryType)
                    })
                    .click()
            }
            
            switch(addrType) {
                case 'addAddr' : 
                    cy.get('.address-dropdown')
                        .should('not.have.class', 'open')
                    cy.get('#actual-address').contains('กรุณาเลือกที่อยู่จัดส่ง')
                        .click()
                    cy.get('.address-dropdown')
                        .should('have.class', 'open')
                    cy.get('#add-new-address')
                        .should('contain', 'เพิ่มที่อยู่ใหม่')
                        .click()
                    cy.get('.address-dropdown')
                        .should('not.have.class', 'open')
                    cy.createAddress(customerDetails)
                    break;
                case 'existingAddr' :
                    var address = customerDetails.addressNo + ' ' + 
                        customerDetails.moo + ' ' + 
                        customerDetails.soi + ' ' + 
                        customerDetails.street + ' ' + 
                        customerDetails.subDistrict + ' ' + 
                        customerDetails.district + ', ' + 
                        customerDetails.province
                    cy.get('.address-dropdown')
                        .should('not.have.class', 'open')
                    cy.get('#actual-address').contains('กรุณาเลือกที่อยู่จัดส่ง')
                        .click()
                    cy.get('.address-dropdown')
                        .should('have.class', 'open')
                    cy.get('ul.dropdown-menu > li.address').contains(address)
                        .click()
                    cy.get('.address-dropdown')
                        .should('not.have.class', 'open')                    
                    break;
            } 
            break;   
    }

    if (!taxInvoice.useTaxInvoice) {
        if (Cypress.$('.tax-invoice-wrappper[style="display: block;"]').length > 0) {
            cy.get('[for="request-tax-invoice-checkbox"]').contains('ขอใบกำกับภาษีเต็มรูปแบบ')
                .click()
        }
        cy.get('.tax-invoice-wrappper')
            .should('have.attr', 'style', 'display: none;')
    } else {
        if (Cypress.$('.tax-invoice-wrappper[style="display: none;"]').length > 0) {
            cy.get('[for="request-tax-invoice-checkbox"]').contains('ขอใบกำกับภาษีเต็มรูปแบบ')
            .click()
        }
        cy.fillTaxInvoice(taxInvoice)
    }
})

Cypress.Commands.add('verifyOrder', (product, productList, haveSplitOrder) => {
    var index = productList - 1
    var className = ''
    if (haveSplitOrder) {
        if (product.isSplit == 'N') {
            className = '.basket-positions-combined-store > .items > .item'
        } else {
            className = '.basket-positions-combined-home > .items > .item'
        } 
    } else {
        className = '.basket-positions-all > .items > .item'
    }   
    cy.get(className).eq(index).should(($product) => {
        expect($product).to.contain('รายการที่ #' + productList)
        expect($product).to.contain(product.name)
        expect($product).to.contain('โค้ด:' + product.barcode)
    })
})

Cypress.Commands.add('verifyOrderAtPayment', (product, productList) => {
    cy.get('tbody:first-child > .items').eq(productList).should(($product) => {
        expect($product).to.contain(product.name)
    })
    cy.get('tbody:first-child > .items > td[align="center"]').eq(productList).should(($amount) => {
        expect($amount).to.contain(product.amount)
    })

    var price = formatNumber(product.amount * product.price)
    cy.get('tbody:first-child > .items > .currency').eq(productList).should(($price) => {
        expect($price).to.contain('฿ ' + price)
    })
})

Cypress.Commands.add('checkPromotion', (promotion) => {
    // var discount = 0
    // var productPrice = 0
    // var haveProducts = false

    cy.get('a.coupon-reset').should('be.visible')
        .and('have.attr', 'data-promo-code', promotion.id.toUpperCase())
    if (promotion.description != "") {
        cy.get('ul.promotions')
            .should('contain', promotion.description)
    }            

    // calculate promotion

    // if (promotion.type == '') {
    //     productPrice = orderSum
    //     cy.log('productPrice : ' + productPrice)
    // } else {
    //     products.forEach((product) => {
    //         if (promotion.type == product.type) {
    //             productPrice += (product.price * product.amount)
    //             cy.log('productPrice : ' + productPrice)
    //             haveProducts = true
    //         }
    //     })
    // }                    
    // cy.log('productPrice : ' + productPrice)

    // cy.log('promotion.discountType : ' + promotion.discountType)
    // if (productPrice >= promotion.minimum) {
    //     switch (promotion.discountType) {
    //         case 'percentage' : 
    //             if (productPrice >= promotion.maxDiscount) {
    //                 discount = promotion.maxDiscount
    //             } else {
    //                 discount = productPrice
    //             }
    //             cy.get('tr.line-coupon')
    //                 .should('contain', promotion.code)
    //             cy.log('discount : ' + discount)
    //             break;
    //         case 'fixedAmount' :
    //             discount = promotion.benefit
    //             cy.get('tr.line-coupon')
    //                 .should('contain', promotion.code)                            
    //             break;
    //         case 'freeShipping' : 
    //             if (haveProducts == true) {
    //                 shippingFee = 0
    //                 cy.get('tr.line-coupon')
    //                     .should('contain', promotion.code)
    //             }
    //             break; 
    //         case 'freeProduct' : 
    //             if (haveProducts == true) {
    //                 cy.get('#tbody-free-item > .radio-styled > .show-description').first()
    //                     .should('contain', promotion.freeProduct)
    //                 cy.get('#tbody-free-item > .radio-styled > [align="center"]').first()
    //                     .should('contain', promotion.freeQty)

    //             }
    //             break;
    //     }
    // } 
})

Cypress.Commands.add('typeCoupon', (promotionId) => {
    cy.get('input#promo-code')
        .type(promotionId)
    cy.get('input#promo-code')
        .invoke('val')
        .then(couponId => {
            cy.log('couponId  is  :  ' + promotionId)
            if (!couponId.includes(promotionId)) {
                cy.get('input#promo-code')
                    .clear()
                    cy.typeCoupon(promotionId)
            }
        })
})

Cypress.Commands.add('typePromotion', (promotion) => {
    switch (promotion.searchType) {
        case 'myCoupon' : 
            cy.get('a.lightbox')
                .should('contain', 'เลือกจาก My coupon')
                .click({force: true})
                .should('not.have.css', 'display', 'none')

            cy.get('.select-radio-voucher')
                .check(promotion.id, {force: true})
            cy.get('button.submit-voucher')
                .click()
            break;
        case 'typeCoupon' : 
            // cy.get('input#promo-code')
            //     .wait(3000)
            //     .type(promotion.id)
            cy.typeCoupon(promotion.id)
            cy.get('a.redeem-voucher-btn')  
                .should('contain', 'ใช้รหัสคูปอง')
                .click()
            break;
    }

    // cy.wait(2000)
    // cy.get('a.coupon-reset', { timeout: 10000 }).should('be.visible')
    // // cy.get('a.coupon-reset')
    //     .and('have.attr', 'data-promo-code', promotion.id)
    // cy.get('ul.promotions')
    //     .should('contain', promotion.description)
})

Cypress.Commands.add('discountAMB', (discountAMBPoint) => {
    cy.get('.discount-of-allmember ')
        .should('have.class', 'd-none')
    cy.get('input#allpoint-burn')
        .type(discountAMBPoint)
    cy.get('.allmember-burn-section-submit-in-progress-enable')
        .should('have.class', 'active')
        .click()
    cy.get('.discount-of-allmember ')
        .should('not.have.class', 'd-none')
})

Cypress.Commands.add('discountMstamp',(discountMstamp) => {
    cy.get('input#mstamp-burn')
        .type(discountMstamp)
    cy.get('.mstamp-burn-section-submit-in-progress-enable')
        .should('have.class', 'active')
        .click()
    var str = formatNumber(discountMstamp.toString())
    cy.get('#current-amount-stamp > .current-discount')
        .should('contain', 'B ' + str)
})

Cypress.Commands.add('verifyTotalPrice', (sum, shippingFee, totalPrice, amb, mstamp, discount, usePromotion, discountAMB, discountMStamp) => {
    var indexPrice = 1
    var indexPoint = 0

    cy.get('.price')
        .should('contain', sum)

    if (usePromotion) {
        indexPrice++
    }
    
        cy.get('#js-invoice-details-tbody > tr').eq(indexPrice) // eq 2
        .should('contain', '฿ ' + shippingFee)
    if (discount > 0) {
        cy.log('discountttttttt : ' + discount )
        cy.get('#js-invoice-details-tbody > tr').eq(indexPrice + 1) // eq 3
            .should('contain', formatNumber(discount))
    } 
    // else {
    //     cy.get('#js-invoice-details-tbody > tr').eq(indexPrice)
    //         .should('contain', '฿ ' + shippingFee)
    // }

    if (discountAMB > 0) {
        cy.get('#allmember-discount')
            .should('contain', formatNumber(discountAMB))
    }
    
    if (discountMStamp > 0) {
        cy.get('#mstamp-discount')
            .should('contain', formatNumber(discountMStamp))
    }

    cy.get('span#totalAmount')
        .should('contain', '฿ ' + totalPrice)
    
    if (amb > 0) {
        cy.get('.line-last > .currency').eq(indexPoint)
            .should('contain', formatNumber(amb))
        indexPoint++
    }

    if (mstamp > 0) {
        cy.get('.line-last > .currency').eq(indexPoint)
            .should('contain', formatNumber(mstamp))
    }
})

Cypress.Commands.add('payment', (paymentDetails) => {
    const typeCC = 'ชำระเงินด้วยบัตรเครดิต หรือ บัตรเดบิต'
    const tpyeTMW = 'ชำระด้วยทรูมันนี่ วอลเล็ท'
    const typeCash= 'ชำระเงินสด ที่ร้านเซเว่นอีเลฟเว่น ( 7-11)'
    var paymentTypeText = ''
    var title = ''

    switch (paymentDetails.paymentType) {
        case 'PAYATALL_CC' : 
            paymentTypeText = typeCC
            break;
        case 'PAYATALL_TMN' : 
            paymentTypeText = tpyeTMW
            break;
        case 'PAYATALL_CS' : 
            paymentTypeText = typeCash
            break;
    }    
    cy.get('button[type="submit"]').contains('สั่งซื้อ')
        .should('have.class', 'disabled')
    cy.get('button.' + paymentDetails.paymentType + '-tab')
        .should(($paymentType) => {
            expect($paymentType).to.contain(paymentTypeText)
        })
        .click()
        .should('have.attr', 'aria-expanded', 'true')
    
    if (paymentDetails.paymentType == 'PAYATALL_TMN') {
        cy.wait(2000)
        cy.get('input[name="checkoutData.paymentData.trueMoneyMobileNumber"]')
            .type(paymentDetails.phoneNo)
    }

    cy.get('button[type="submit"]').contains('สั่งซื้อ')
        .should('not.have.class', 'disabled')
        .click({force : true})

    cy.url().should('include', '/checkout/payment-extern/')
    switch (paymentDetails.paymentType) {
        case 'PAYATALL_CC' : 
            title = 'Payment Detail'
            break;
        case 'PAYATALL_TMN' : 
            title = 'ชำระเงิน'
            break;
        case 'PAYATALL_CS' : 
            title = 'ชำระเงิน'
            break;
    }
    cy.title().should('eq', title)
})

Cypress.Commands.add('checkReceipt', (paymentDetails, username, totalPrice) => {
    switch (paymentDetails.paymentType) {
        case 'PAYATALL_CC' : 
            cy.url().should('include', '/paynow')  
            cy.title().should('eq', 'Payment Detail')

            cy.get('input#cardNo')
                .type(paymentDetails.cardNo)
            cy.get('select#epMonth')
                .select(paymentDetails.expMonth)
                .should('have.value', paymentDetails.expMonth)
            cy.get('select#epYear')
                .select(paymentDetails.expYear)
            cy.get('input#securityCode')
                .type(paymentDetails.cvv)
            cy.get('input#cardHolder.form-control')
                .type(paymentDetails.name, {force : true})
            cy.wait(2000)
            cy.get('input#submitpay')
                .should('have.value', 'ชำระเงิน')
                .click()
                .should('have.value', 'กำลังดำเนินการ...')

            var firstFour = paymentDetails.cardNo.substr(0, 4)
            var lastFour = paymentDetails.cardNo.substr(paymentDetails.cardNo.length - 4)
            cy.get('.tableLayout')
                .should(($payBill) => {
                    expect($payBill).to.contain(totalPrice)
                    expect($payBill).to.contain(firstFour + ' ****  **** ' + lastFour)
                    expect($payBill).to.contain(paymentDetails.name)
                    expect($payBill).to.contain('สำเร็จ')
                })
            cy.get('input[type="submit"]')
                .should('contain', 'กลับสู่หน้าร้านค้า')
                .click()
                .wait(2000)
            cy.url().should('include', '/checkout/confirmation')
            cy.title().should('eq', 'AllOnline')
            break;
        case 'PAYATALL_TMN' : 
            cy.url().should('include', '/paynow')  
            
            cy.title().should('eq', 'Pay@All OTP Verification')
            cy.get('h3.title')
                .should('contain', 'ยืนยันรหัส OTP')
            cy.get('div.subtitle')
                .should('contain', paymentDetails.phoneNo)
            cy.get('table.summary-order')
                .should('contain', totalPrice + ' บาท')
            cy.get('button[type="submit"]')
                .should('have.attr', 'disabled')
            cy.wait(2000)
            cy.get('input#otp1')
                .type(paymentDetails.otp)
            cy.get('button[type="submit"]')
                .should('not.have.attr', 'disabled')
            cy.get('button[type="submit"]')
                .click()

            cy.url().should('include', '/paynow/paymentTmn')
            cy.title().should('eq', 'Pay@All Transaction Summary')
            cy.get('h3.result-title')
                .then(($result) => {
                    var text = $result.text()
                    cy.log('resultttttttttt : ' + text)
                    if (text.includes('ไม่สำเร็จ')) {
                        throw 'Payment TMW : ไม่สำเร็จ ระบบใช้งานไม่ได้ชั่วคราว'
                    }
                })
                cy.get('h3.result-title')
                    .should('contain', 'สำเร็จ')
                cy.get('ul.transaction-data')
                    .should(($payBill) => {
                        expect($payBill).to.contain(totalPrice + ' บาท')
                        expect($payBill).to.contain(paymentDetails.phoneNo)
                    })
            
                cy.get('button[type="submit"]')
                    .should('contain', 'กลับสู่หน้าร้านค้า')
                    .click({force : true})
                    .wait(2000)
                cy.url().should('include', '/checkout/confirmation')
                cy.title().should('eq', 'AllOnline')    
            break;
        case 'PAYATALL_CS' : 
            var intDigit = totalPrice.toString().split(".")[0]
            var decimalDigit = totalPrice.toString().split(".")[1]

            cy.contains('ผู้ชำระเงิน/Payer:')
                .siblings('.detail-table-right')
                .should('contain', username)
            cy.get('.detail-ps-right-sum')
                .should('contain', intDigit)
            cy.get('.detail-ps-right-unit')
                .should('contain', '.' + decimalDigit)

            cy.url().should('include', '/paynow')
            cy.title().should('eq', 'ใบแจ้งค่าสินค้า/บริการ (PaySlip) : PayAtAll')
            break;
    }
    
})

Cypress.Commands.add('checkAMB', (username, amb) => {
    cy.get('a#login-dropdown > span.ellipsis-330')
        .should('contain', username)
        .wait(1000)
        .click({force : true})

    cy.get('a.clean').contains('บัญชีของฉัน')
        .should('have.attr', 'href', '/account/')
        .click()
    cy.url().should('include', '/account/')
    cy.title().should('eq', 'AllOnline')

    cy.get('a[href="/account/reward-history/"]')
        .should('contain', 'รายการย้อนหลัง')
        .click()
    cy.url().should('include', '/account/reward-history/')
    cy.title().should('eq', 'AllOnline')

    cy.get('.reward-detail').contains('คุณได้รับ All Member Point จำนวน').first()
        .should('contain', formatNumber(amb))
})

Cypress.Commands.add('openOrderHistory', () => {
    cy.get('a#orderhistory-dropdown')
    .should('contain', 'ติดตามสถานะการสั่งซื้อ')
    .then(($orderHistory) => {
        cy.wait(3000)
        cy.wrap($orderHistory)
            .click({force : true})
        cy.wrap($orderHistory)
            .parent('li')
            .invoke('attr', 'class')
            .then(($att) => {
                const att = $att
                if (!att.includes('open')) {
                    return cy.openOrderHistory()
                } else if (att.includes('open')) {
                    cy.wrap($orderHistory)
                    .parent('li')
                    .should('have.class', 'open')
                }
            })
    })
})

Cypress.Commands.add('checkStatusOrder', (orderNo) => {
    cy.on('uncaught:exception', (err) => {
        expect(err.message).to.include('something about the error')
        done()
        return false
    })

    cy.openOrderHistory()
        
    cy.wait(3000) 
    cy.get('input#extOrderNo')
        .should('have.attr', 'placeholder', 'เลขที่สั่งซื้อ')
        .type(orderNo)
    cy.get('button.btn-proceed').contains('ค้นหา')
        .click({force : true})
    
    cy.title().should('eq', 'AllOnline')
    cy.url().should('include', '/account/order-history/')
    cy.get('.order-number-wrapper')
        .should('contain', orderNo)   
})

// -----------------------------------------------------------------------------------

Cypress.Commands.add('storeSearch', (addrType, storeId, storeName) => {
    cy.get('button[data-target="#' + addrType + '-tab"]')
        .click()
    switch(addrType) {
        case 'store-number' :            
            cy.get('input#user-storenumber-input')
                .type(storeId)
                .should('have.value', storeId)
            cy.get('button#btn-check-storenumber').contains('ยืนยันรหัสร้าน')
                .click()
            break;
        case 'recent-store' :
            cy.get('label[for="s-recent-' + storeId + '"]').contains(storeId)
                .should(($store) => {
                    expect($store).to.contain(storeId)
                    expect($store).to.contain(storeName)
                })
                .click()
            break;
        case 'store-allmap' :
            cy.get('input#input-store')
                .type(storeId)
                .should('have.value', storeId)
            cy.wait(3000)
            cy.get('button#js-store-search-map-btn')
                .should('contain', 'ค้นหา')
                .click()
            cy.get('.search-result-list[data-storeid="' + storeId + '"]').should(($store) => {
                expect($store).to.contain('รหัสสาขา :' + storeId)
                expect($store).to.contain('ชื่อสาขา :' + storeName)
            })
                .click()
            cy.wait(3000)
            cy.get('#js-store-selected-btn')
                .should('contain', 'เลือกสาขา')
                .click({force: true})
            break;
    }
    cy.wait(2000)
    cy.get('.address-7_11_store-detail-header').should(($address) => {
        expect($address).to.contain(storeId)       
    })
    
})

Cypress.Commands.add('createAddress', (customerDetails) => {
    var fname = customerDetails.customerName.toString().split(" ")[0]
    var lname = customerDetails.customerName.toString().split(" ")[1]
    
    cy.get('#new-address-name')
        .type(fname)
    cy.get('#new-address-lastname')
        .type(lname)
    cy.get('#new-address-mobile')
        .type(customerDetails.customerPhone)
    cy.get('#new-address-addrno')
        .type(customerDetails.addressNo)
    cy.get('#new-address-floor')
        .type(customerDetails.floor)
    cy.get('#new-address-moo')
        .type(customerDetails.moo)
    cy.get('#new-address-soi')
        .type(customerDetails.soi)
    cy.get('#new-address-street')
        .type(customerDetails.street)
    cy.get('#select2-new-address-province-container')
        .should('contain', '--- กรุณาเลือกจังหวัด ---')
        .click()
    cy.get('.select2-search__field[type="search"]')
        .type(customerDetails.province + '{enter}')
    cy.get('#select2-new-address-district-container')
        .should('contain', 'เขต/อำเภอ')
        .click()
    cy.get('.select2-search__field[type="search"]')
        .type(customerDetails.district + '{enter}')
    cy.get('#select2-new-address-sub-district-container')
        .should('contain', 'แขวง/ตำบล')
        .click()
    cy.get('.select2-search__field[type="search"]')
        .type(customerDetails.subDistrict + '{enter}')
    cy.get('option[value="' + customerDetails.subDistrict + '"]')
        .should('have.attr', 'data-postalcode', customerDetails.postalCode)
})

Cypress.Commands.add('fillTaxInvoice', (taxInvoice) => {
    cy.get('[for="radioTaxType' + taxInvoice.taxType + '"]')
        .click()
    switch(taxInvoice.taxType) {
        case "Person" : 
            const fname = taxInvoice.name.toString().split(" ")[0]
            const lname = taxInvoice.name.toString().split(" ")[1]
            cy.get('input.is-person[name="shippingData.taxInvoiceData.nationalIdCard"]')
                .type(taxInvoice.cardId)
            cy.get('input[name="shippingData.taxInvoiceData.taxInvoiceAddress.firstname"]')
                .type(fname)
            cy.get('input[name="shippingData.taxInvoiceData.taxInvoiceAddress.lastname"]')
                .type(lname)
            break;
        case "Company" : 
            cy.get('#inputPersonID')
                .type(taxInvoice.cardId)
            cy.get('#inputCompanyName')
                .type(taxInvoice.name)
            var radioTaxType = '#taxbranchType' + taxInvoice.companyType.charAt(0)
            cy.get('input' + radioTaxType)
                .click({force : true})
            if(taxInvoice.companyType.charAt(0) == 'B') {
                cy.get('#inputStoreID')
                    .type(taxInvoice.branchId)
            }
            break;
    }
    cy.get('input[name="shippingData.taxInvoiceData.taxInvoiceAddress.mobilePhone"]')
        .type(taxInvoice.phoneNo)
    cy.get('input[name="shippingData.taxInvoiceData.taxInvoiceAddress.addrNo"]')
        .type(taxInvoice.addressNo)
    cy.get('input[name="shippingData.taxInvoiceData.taxInvoiceAddress.floor"]')
        .type(taxInvoice.floor) 
    cy.get('input[name="shippingData.taxInvoiceData.taxInvoiceAddress.moo"]')
        .type(taxInvoice.moo)
    cy.get('input[name="shippingData.taxInvoiceData.taxInvoiceAddress.soi"]')
        .type(taxInvoice.soi)
    cy.get('input[name="shippingData.taxInvoiceData.taxInvoiceAddress.street"]')
        .type(taxInvoice.street)
    cy.get('select[name="shippingData.taxInvoiceData.taxInvoiceAddress.province"]')
        .select(taxInvoice.province, {force: true})
    cy.get('select[name="shippingData.taxInvoiceData.taxInvoiceAddress.district"]')
        .select(taxInvoice.district, {force: true})
    cy.get('select[name="shippingData.taxInvoiceData.taxInvoiceAddress.subDistrict"]')
        .select(taxInvoice.subDistrict, {force: true})
    cy.get('option[value="' + taxInvoice.subDistrict + '"]')
        .should('have.attr', 'data-postalcode', taxInvoice.postalCode)
})

// --------------------- || coupon || -------------------------------

Cypress.Commands.add('findCoupon', (code, iscated, haveCoupon = 'Y') => {
    var isFound = false
    cy.get('.code').then(($ele) => {
        for (let i = 0; i < $ele.length; i++) {
            if (iscated && !haveCoupon) {
                expect($ele.eq(i)).not.to.contain(code)
            } else if ($ele.eq(i).text().includes(code)){
                isFound = true
                break;
            }            
        }
        if(!isFound) {
            cy.get('.next.paging-number').then(() => {
                var e = Cypress.$('.next.paging-number')
                cy.wrap(e)
                    .invoke('attr', 'class')
                    .then(($att) => {
                        const att = $att
                        if (!att.includes('disable')) {
                            cy.get('.next.paging-number')
                                .click({force : true})
                            return cy.findCoupon(code)
                        } else if (haveCoupon) {
                            throw 'Cannot find coupon ' + code
                        }
                    })
            })       
        }
    })
})

Cypress.Commands.add('checkCoupon', (coupon) => {
    cy.get('.code').contains(coupon.code)
    .should('contain', coupon.code)
    .parents('.single-voucher').then(($ele) => {

        cy.wrap($ele)
            .invoke('attr', 'class')
            .then(($attr) => {
                const attr = $attr
                if (attr.includes('redeemed')) {
                    cy.wrap($ele).then(($coupon) => {
                        expect($coupon).to.have.class('redeemed')
                        expect($coupon).to.contain('เก็บแล้ว')
                    })
                } else {
                    cy.wrap($ele).then(($coupon) => {
                        expect($coupon).not.to.have.class('redeemed')
                        expect($coupon).to.have.class(coupon.type)
                        expect($coupon).to.contain('รับคูปอง')
                    })
                }
            })
        cy.wrap($ele)
            .find('.voucher-details-wrapper > .voucher-details > .condition > .main')
            .should('contain', coupon.description)
        var expireDate
        if (coupon.expire != "") {
            expireDate = 'หมดอายุ :' + coupon.expire
            
        } else {
            expireDate = ''
        }      
        cy.wrap($ele)
            .find('.voucher-details-wrapper > .voucher-details > .expired')
            .should('contain', expireDate)  
        cy.wrap($ele)
            .find('.voucher-details-wrapper > .voucher-details > .benefit')
            .should('contain', coupon.benefit)
    }) 
})

Cypress.Commands.add('getCoupon', (code) => {
    cy.get('.code').contains(code).then(($coupon) => {
        cy.wrap($coupon)
            .parents('.single-voucher')
            .invoke('attr', 'class')
            .then(($attr) => {
                const attr = $attr
                if (!attr.includes('redeemed')) {
                    cy.wrap($coupon)
                        .parents('.single-voucher')
                        .find('.voucher-claim')
                        .should('contain', 'รับคูปอง')
                    cy.wrap($coupon)
                        .parents('.single-voucher')
                        .find('.voucher-claim')
                        .click()
                        .should('contain', 'เก็บแล้ว')
                }
            })
    })
})

// --------------------- || page || -------------------------------
Cypress.Commands.add('findProduct', (product, testType, type, haveNextPage) => {
    var isFound = false  

    if (haveNextPage) {
        cy.get('.item.description').then(($product) => {
            cy.log('product length : ' + $product.length)
            for (let i = 0; i < $product.length; i++) {
                if ($product.eq(i).text().includes(product.name)){
                    isFound = true
                    break;
                }         
            }
        
            if(!isFound) {
                cy.get('.hidden-print > .pagination.list-pager > .next').then(($ele) => {
                    cy.wrap($ele)
                        .invoke('attr', 'class')
                        .then(($att) => {
                            const att = $att
                            if (!att.includes('disable')) {
                                cy.wrap($ele)
                                    .children('.glyphicon-arrow-right')
                                    .click({force : true})
                                    .wait(1000)
                                return cy.findProduct(product, testType, type, haveNextPage)
                            } else {
                                throw 'Cannot find product ' + product.name
                            }
                        })
                })       
            }
        })
    }

    cy.get('.product_grid').contains(product.name)
        .parents('.product-item')
        .then(($product) => {
            switch (type) {
                case 'flashsale' :
                case 'pre-order' :
                case 'new' :
                    cy.wrap($product)
                        .find('.image > .flag-top-left')
                        .then(($flag) => {
                            expect($flag).to.have.class('flag-' + type)
                        }) 
                    break;
                case 'promotion' : 
                case 'bestSeller' : 
                    cy.wrap($product)
                        .find('.image')
                        .children()
                        .then(($flag) => {
                            expect($flag).not.to.have.class('flag-' + type)
                        }) 
                    break;
            }

            var classSuffix = ''
            switch (testType) {
                case 'flashsale' : 
                    classSuffix = '-flashsale'
                    break;
                case 'new' : 
                case 'promotion' :
                case 'bestseller' :
                case 'brand' : 
                    classSuffix = ''
                    break;
            }
            if (product.discountPrice <= 0) {
                cy.wrap($product)
                    .find('.price-bottom' + classSuffix + ' > span > strong')
                    .should('contain', formatNumber(product.price))
            } else {
                cy.wrap($product)
                    .find('.price-bottom' + classSuffix + ' > span > strong')
                    .should('contain', formatNumber(product.discountPrice))
                cy.wrap($product)
                    .find('.price-bottom' + classSuffix + ' > div > s')
                    .should('contain', formatNumber(product.price))
                cy.wrap($product)
                    .find('.flag-saving' + classSuffix + ' > span')
                    .should('contain', product.discount + '%')
            }
        })
    
})

Cypress.Commands.add('selectProduct', (product, length, index = 0) => {
    const click = $el => $el.click()
    var isFound = false
    cy.get('.product_grid > .product-item').then(($products) => {
        cy.wrap($products).eq(index)
            .find('a.productlink > .item.description')
            .then(($product) => {
                if($product.text().includes(product.name)) {
                    cy.wrap($product)
                        // .pipe(click)
                        .click({force : true})
                        .wait(1000)
                    cy.title().should('eq', product.name + ' | AllOnline')
                    isFound = true
                }

                if(!isFound) {
                    index++
                    if (index >= length) {
                        throw 'Cannot find product ' + product.name
                    } else {
                        cy.selectProduct(product, length, index)
                    }
                }
            })        
    })
    
})

Cypress.Commands.add('checkProductDetail', (product, type, testType) => {
    var length = 0 
    var index = 0
    
    switch (type) {
        case 'flashsale' :
        case 'pre-order' :
        case 'new' :
        case 'bestseller' :
            cy.get('.js-pdt.pdt-lg > .flag-top-left')
                .should('have.class', 'flag-' + type)
            break;
        case 'promotion' : 
            cy.get('.js-pdt.pdt-lg').first()
                .children()
                .should('not.have.class', 'flag-top-left')
            break;
    }
    cy.get('h1[itemprop="name"]')
        .should('contain', product.name)
    cy.get('span[itemprop="sku"]')
        .should('contain', product.barcode)
    if (product.discountPrice <= 0) {
        cy.get('.price > .currentPrice')
            .should('contain', '฿ ' + formatNumber(product.price))
    } else if (product.rangePrice.isRange && Cypress.$('.price > .currentPriceOverAll').length > 0) {
        cy.get('.price > .currentPriceOverAll')
            .should('contain', '฿ ' + product.rangePrice.price)
    } 
    else {
        cy.get('.price > .currentPrice')
            .should('contain', '฿ ' + formatNumber(product.discountPrice))
        cy.get('.price > strike')
            .should('contain', '฿ ' + formatNumber(product.price))
        cy.get('.flag-saving-pd')
            .should('contain', '-' + product.discount + '%')
    }

    if (product.getAMB) {
        var price = 0
        if (product.discountPrice <= 0) {
            price = parseInt(product.price / 10) * 3
        } else {
            price = parseInt(product.discountPrice / 10) * 3            
        }
        cy.get('.allmember-content-head')
            .should('contain', 'คุณจะได้รับ ' + formatNumber(price) + ' แต้ม')
    } else {
        cy.get('.allmember-content-head')
            .should('contain', 'สินค้านี้ไม่ร่วมโปรโมชั่น ALL member')
    }

    length = product.miniDescription.length || 0
    if (length > 0) {
        index = 0
        product.miniDescription.forEach((miniDesc) => {
            cy.get('.enable-true > ul > li').eq(index)
                .then(($detail) => {
                    if (miniDesc.includes('"')) {
                        var text = miniDesc.split('"')
                        for (let j = 0; j < text.length; j++) {
                            expect($detail.text().replace(/\s/g, '')).to.contain(text[j].replace(/\s/g, ''))
                        }
                    } else {
                        expect($detail.text().replace(/\s/g, '')).to.contain(miniDesc.replace(/\s/g, ''))
                    }
                })
                index++ 
        })
    } else {
        cy.get('.enable-true > ul')
            .should('not.exist')
    }

    length = product.description.tableDetails.length || 0
    if (length > 0) {
        index = 0
        product.description.tableDetails.forEach((detail) => {
            cy.get('.markup_features_tab > tbody > tr').eq(index)
                .children('td').last()
                .then(($detail) => {
                    if (detail.includes('"')) {
                        var text = detail.split('"')
                        for (let j = 0; j < text.length; j++) {
                            expect($detail.text().replace(/\s/g, '')).to.contain(text[j].replace(/\s/g, ''))
                        }
                    } else {
                        expect($detail.text().replace(/\s/g, '')).to.contain(detail.replace(/\s/g, ''))
                    }
                })
            index++
        })
    } else {
        cy.get('.markup_features_tab > tbody')
            .should('not.exist')
    }

    length = product.description.detail.length || 0
    if (length > 0) {
        product.description.detail.forEach((desc) => {
            cy.get('span[itemprop="description"]').then(($desc) => {
                    if (desc.includes('"')) {
                        var text = desc.split('"')
                        for (let j = 0; j < text.length; j++) {
                            expect($desc.text().replace(/\s/g, '')).to.contain(text[j].replace(/\s/g, ''))
                        }
                    } else {
                        expect($desc.text().replace(/\s/g, '')).to.contain(desc.replace(/\s/g, ''))
                    }
            })
        })
    } else {
        cy.get('span[itemprop="description"]')
            .should('not.exist')
    }
})

// --------------------- || wish list || -------------------------------

Cypress.Commands.add('clearWishList', () => {
    if (Cypress.$('.row.item').length > 0) {
        cy.get('.row.item').then(($product) => {
            var length = $product.length
    
            for (let i = 0; i < length; i++) {
                cy.get('a.remove').first()
                    .click({force : true})
            }
        })
    } else {
        cy.get('.warning.success')
            .should('contain', 'คุณยังไม่มีรายการสินค้าในรายการสินค้าโปรดของคุณ')
    }   
})

Cypress.Commands.add('searchProduct', (product) => {
    cy.get('input.header-search')
        .type(product.barcode)
        .should('have.value', product.barcode)
    cy.get('button.search')
        .first()
        .click()
    cy.title().should('eq', 'AllOnline')

    cy.get('div.description').contains(product.name)
        .click()

    cy.title().should('eq', product.name + ' | AllOnline')
    cy.get('[itemprop="name"]')
        .should('contain', product.name)
})
