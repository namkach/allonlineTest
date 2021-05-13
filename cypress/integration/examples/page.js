describe('Check each page', () => {
    const coupons = require("../../fixtures/coupons.json")
    const getCoupons = require("../../fixtures/getCoupons.json")
    const flashsale = require("../../fixtures/flashSale.json")
    const newProduct = require("../../fixtures/newProduct.json")
    const promotionProduct = require("../../fixtures/promotion.json")
    const bestseller = require("../../fixtures/bestseller.json")
    const wishList = require("../../fixtures/wishList.json")
    const brand = require("../../fixtures/brand.json")
    const loginUsername = Cypress.env('loginUsername')
    const loginPassword = Cypress.env('loginPassword')
    const username = Cypress.env('username')
    var testType = ''
    var type = ''
    var haveNextPage = false

    beforeEach('Login', function() {
        cy.visit('https://integ1.allonline.7eleven.co.th/')
        cy.title().should('eq', '7Online') 
        cy.log('loginUsername : ' + loginUsername)
        cy.log('loginPassword : ' + loginPassword)
        cy.log('username : ' + username)
        cy.login(loginUsername, loginPassword, username)
    })

    afterEach('Logout', function() {
        cy.logout(username)
    })

    it.only('Test CircleCI : pages.js', () => {
        cy.log('Hello world!, this is a CircleCI test for pages.js')
    })

    coupons.forEach((coupon) => {
        // var code = coupon.id  
        var category = coupon.category
        var iscated = false
        var haveCoupon = false
        it('Coupon Page | Check coupon : ' + coupon.id, () => {
            cy.get('a[href="/coupon/"]')
                .should('contain', 'คูปองส่วนลด')
                .click()
            cy.title().should('eq', 'Coupon | AllOnline')
            cy.url().should('include', '/coupon/')

            cy.get('.js-voucher-group').then(() => {
                var group = Cypress.$('.js-voucher-group')

                for(let i = 0; i < group.length; i++) {
                    cy.wrap(group).eq(i)
                        .invoke('attr', 'data-voucher-group')
                        .then(($attr) => {
                            const attr = $attr
                            cy.get('a.js-voucher-group[data-voucher-group="' + attr + '"]')
                                .click()
                                .wait(1000)
                            cy.get('li.paging-number[data-target-page="0"]').contains('1')
                                .click({force : true}) 
                            switch(attr) {
                                case 'ALL_7online' :   
                                    try {
                                        cy.findCoupon(coupon.id, iscated)
                                        cy.checkCoupon(coupon)  
                                    } catch (e) {
                                        console.error(e);                                    
                                    }
                                    break;
                                case 'UNRESTRICTED_7online' :
                                    iscated = true
                                    if (category == attr) {
                                        try {
                                            cy.findCoupon(coupon.id, iscated)
                                            cy.checkCoupon(coupon) 
                                        } catch (e) {
                                            console.error(e);                                    
                                        }
                                    } else {
                                        haveCoupon = false
                                        try {
                                            cy.findCoupon(coupon.id, iscated, haveCoupon)
                                        } catch (e) {
                                            console.error(e);                                    
                                        }
                                    }
                                    break;
                            }
                        })
                }
            })
        })
    })
    
    flashsale.forEach((product) => {
        it('Flash Sale Page | Check product : ' + product.name, () => {
            testType = 'flashsale'
            cy.get('.list-unstyled > li > a[href="/flashsale/"]')
                .should('contain', 'Flash Sale')
                .click()
            cy.title().should('eq', 'Flash Sale | AllOnline')
            cy.url().should('include', '/flashsale/')

            if (product.type == "") {
                type = 'flashsale'
            } else {
                type = product.type
            }
            cy.findProduct(product, testType, type)
            cy.get('.product_grid > .product-item').then(($products) => {
                var size = $products.length
                cy.log('size of elements : ' + size)
                cy.log('------------------------')
                cy.selectProduct(product, size)

            })
            // cy.checkProductDetail(product, type)
            cy.checkProductDetail(product)
        })
    })

    newProduct.forEach((product) => {
        it('New Product Page | Check product : ' + product.name, () => {
            testType = 'new'
            cy.get('.list-unstyled > li > a[href="/new-arrival/"]')
                .should('contain', 'สินค้ามาใหม่')
                .click()
            cy.title().should('eq', 'สินค้ามาใหม่ | AllOnline')
            cy.url().should('include', '/new-arrival/')

            if (product.type == "") {
                type = 'new'
            } else {
                type = product.type
            }

            haveNextPage = false
            cy.get('.how-many').then(($number) => {
                var text = $number.text()
                var number = parseInt(text.replace(/ สินค้า|\(|\)/g, ''))
                cy.log('number : ' + number)
                if (number > 30) {
                    haveNextPage = true
                    cy.log('number more than 30')
                    cy.log('haveNextPage : ' + haveNextPage)
                } else {
                    cy.log('number not more than 30')
                    cy.log('haveNextPage : ' + haveNextPage)
                }

                cy.findProduct(product, testType, type, haveNextPage)
                cy.get('.product_grid > .product-item').then(($products) => {
                    var size = $products.length
                    cy.log('size of elements : ' + size)
                    cy.log('------------------------')
                    cy.selectProduct(product, size)
    
                })
                // cy.checkProductDetail(product, type)
                cy.checkProductDetail(product)
            })
        })
    })

    promotionProduct.forEach((product) => {
        it('Promotion Page | Check product : ' + product.name, () => {
            testType = 'promotion'
            cy.get('.list-unstyled > li > a[href="/promotion/"]')
                .should('contain', 'สินค้าโปรโมชั่น')
                .click()
            cy.title().should('eq', 'สินค้าโปรโมชั่น | AllOnline')
            cy.url().should('include', '/promotion/')

            if (product.type == "") {
                type = 'promotion'
            } else {
                type = product.type
            }

            haveNextPage = false
            cy.get('.how-many').then(($number) => {
                var text = $number.text()
                var number = parseInt(text.replace(/ สินค้า|\(|\)/g, ''))
                cy.log('number : ' + number)
                if (number > 30) {
                    haveNextPage = true
                    cy.log('number more than 30')
                    cy.log('haveNextPage : ' + haveNextPage)
                } else {
                    cy.log('number not more than 30')
                    cy.log('haveNextPage : ' + haveNextPage)
                }

                cy.findProduct(product, testType, type, haveNextPage)
                cy.get('.product_grid > .product-item').then(($products) => {
                    var size = $products.length
                    cy.log('size of elements : ' + size)
                    cy.log('------------------------')
                    cy.selectProduct(product, size)
    
                })
                cy.checkProductDetail(product)
                // cy.checkProductDetail(product, type)
            })            
        })
    })

    bestseller.forEach((product) => {
        it('Best Seller Page | Check product : ' + product.name, () => {
            testType = 'bestseller'
            cy.get('.list-unstyled > li > a[href="/bestseller/"]')
                .should('contain', 'สินค้าขายดี')
                .click()
            cy.title().should('eq', 'สินค้าขายดี | AllOnline')
            cy.url().should('include', '/bestseller/')

            if (product.type == "") {
                type = 'bestseller'
            } else {
                type = product.type
            }

            haveNextPage = false
            cy.get('.how-many').then(($number) => {
                var text = $number.text()
                var number = parseInt(text.replace(/ สินค้า|\(|\)/g, ''))
                cy.log('number : ' + number)
                if (number > 30) {
                    haveNextPage = true
                    cy.log('number more than 30')
                    cy.log('haveNextPage : ' + haveNextPage)
                } else {
                    cy.log('number not more than 30')
                    cy.log('haveNextPage : ' + haveNextPage)
                }

                cy.findProduct(product, testType, type, haveNextPage)
                cy.get('.product_grid > .product-item').then(($products) => {
                    var size = $products.length
                    cy.log('size of elements : ' + size)
                    cy.log('------------------------')
                    cy.selectProduct(product, size)
                })
                cy.log('ttttttttttt : ' + type)
                // cy.checkProductDetail(product, type, testType)                
                cy.checkProductDetail(product)
            })
        })
    })

    brand.forEach((product) => {
        it('Brand Page | Check product : ' + product.name, () => {
            testType = 'brand'
            cy.get('.list-unstyled > li > a[href="/brands/"]')
                .should('contain', 'แบรนด์')
                .click()
            cy.title().should('eq', 'ช้อปตามแบรนด์ | AllOnline')
            cy.url().should('include', '/brands/')

            cy.get('a[title="' + product.category + '"]')
                .should('contain', product.category)
                .click()

            if (product.type == "") {
                type = 'brand'
            } else {
                type = product.type
            }

            haveNextPage = false
            cy.get('.how-many').then(($number) => {
                var text = $number.text()
                var number = parseInt(text.replace(/ สินค้า|\(|\)/g, ''))
                cy.log('number : ' + number)
                if (number > 30) {
                    haveNextPage = true
                }

                cy.findProduct(product, testType, type, haveNextPage)
                cy.get('.product_grid > .product-item').then(($products) => {
                    var size = $products.length
                    cy.log('size of elements : ' + size)
                    cy.log('------------------------')
                    cy.selectProduct(product, size)
    
                })
                // cy.checkProductDetail(product, type)
                cy.checkProductDetail(product)
            })
        })
    })
    
    it('Wish List Page' ,() => {
        cy.get('.list-inline > .whishlist-icon > a[href="/account/wishlist/"]')
            .should('contain', 'สินค้าโปรด')
            .click()
        cy.title().should('eq', 'AllOnline')
        cy.url().should('include', '/account/wishlist/')

        cy.clearWishList()
        wishList.forEach((product) => {
            cy.searchProduct(product)
            cy.get('.flex-social-fav > .whishlist > .notepad-link')
                .click()
            cy.get('.flex-social-fav > .whishlist')
                .should('have.class', 'highlight')
                .and('have.class', 'animated')
                .and('have.class', 'tada')
        }) 

        cy.get('.list-inline > .whishlist-icon > a[href="/account/wishlist/"]')
            .should('contain', 'สินค้าโปรด')
            .click()
        cy.title().should('eq', 'AllOnline')
        cy.url().should('include', '/account/wishlist/')

        var index = 0 
        wishList.forEach((product) => {
            cy.get('.item-count').eq(index)
                .siblings('a')
                .should('contain', product.name)
                .parents('.row.item')
                .find('.price')
                .should('contain', product.price)
            index++
        })
    })

    getCoupons.forEach((coupon) => {
        it('Coupon Page | Get coupon : ' + coupon.id, () => {
            cy.get('a[href="/coupon/"]')
                .should('contain', 'คูปองส่วนลด')
                .click()
            cy.title().should('eq', 'Coupon | AllOnline')
            cy.url().should('include', '/coupon/')

            var iscated = false
            // cy.log('promotion.code : ' + coupon.id)
            cy.findCoupon(coupon.id, iscated)
            cy.checkCoupon(coupon) 
            cy.getCoupon(coupon.id)
        })
    })
})