use shopify_function::prelude::*;
use shopify_function::Result;

#[derive(Clone, Debug, serde::Deserialize)]
struct Configuration {
    shop: String,
}

#[shopify_function]
fn function(input: input::Input) -> Result<output::Output> {
    let config: Configuration = serde_json::from_str(&input.configuration)?;
    
    let mut operations = vec![];

    // Iterar sobre cada line item del carrito
    for line in &input.cart.lines {
        // Buscar la propiedad _wholesale_price que agregamos desde el storefront
        if let Some(wholesale_price_attr) = line.attribute.as_ref()
            .and_then(|attrs| attrs.iter().find(|attr| attr.key == "_wholesale_price")) 
        {
            if let Ok(wholesale_price) = wholesale_price_attr.value.parse::<f64>() {
                // Calcular el nuevo precio total para la línea
                let quantity = line.quantity;
                let new_total = wholesale_price * quantity as f64;
                
                // Crear operación de transformación
                operations.push(output::Operation {
                    update: output::CartLineUpdate {
                        cart_line_id: &line.id,
                        price: output::Price {
                            adjustment: output::PriceAdjustment {
                                percentage_decrease: None,
                                fixed_price_per_unit: Some(output::Money {
                                    amount: wholesale_price,
                                }),
                            },
                        },
                        title: Some(format!("{} (Precio Mayorista)", line.merchandise.product.title)),
                    },
                });
            }
        }
    }

    Ok(output::Output { operations })
}

mod input {
    use super::*;

    #[derive(Clone, Debug, serde::Deserialize)]
    pub struct Input {
        pub cart: Cart,
        pub configuration: String,
    }

    #[derive(Clone, Debug, serde::Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct Cart {
        pub lines: Vec<CartLine>,
    }

    #[derive(Clone, Debug, serde::Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct CartLine {
        pub id: String,
        pub quantity: i64,
        pub merchandise: Merchandise,
        pub attribute: Option<Vec<Attribute>>,
    }

    #[derive(Clone, Debug, serde::Deserialize)]
    pub struct Merchandise {
        pub product: Product,
    }

    #[derive(Clone, Debug, serde::Deserialize)]
    pub struct Product {
        pub title: String,
    }

    #[derive(Clone, Debug, serde::Deserialize)]
    pub struct Attribute {
        pub key: String,
        pub value: String,
    }
}

mod output {
    use super::*;

    #[derive(Clone, Debug, serde::Serialize)]
    pub struct Output {
        pub operations: Vec<Operation>,
    }

    #[derive(Clone, Debug, serde::Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct Operation {
        pub update: CartLineUpdate,
    }

    #[derive(Clone, Debug, serde::Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct CartLineUpdate {
        pub cart_line_id: String,
        pub price: Price,
        pub title: Option<String>,
    }

    #[derive(Clone, Debug, serde::Serialize)]
    pub struct Price {
        pub adjustment: PriceAdjustment,
    }

    #[derive(Clone, Debug, serde::Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct PriceAdjustment {
        pub percentage_decrease: Option<f64>,
        pub fixed_price_per_unit: Option<Money>,
    }

    #[derive(Clone, Debug, serde::Serialize)]
    pub struct Money {
        pub amount: f64,
    }
}

