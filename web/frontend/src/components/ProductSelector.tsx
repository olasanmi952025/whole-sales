import { Autocomplete, Icon, InlineStack, Text, Spinner } from '@shopify/polaris';
import { SearchMinor } from '@shopify/polaris-icons';
import { useState, useEffect, useMemo } from 'react';

interface Product {
  id: string;
  title: string;
  variants?: Array<{ id: string; title: string; price: string }>;
}

interface Collection {
  id: string;
  title: string;
}

interface ProductSelectorProps {
  targetType: 'product' | 'variant' | 'collection';
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function ProductSelector({ targetType, value, onChange, error }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [variantInputValue, setVariantInputValue] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (targetType === 'collection') {
          const res = await fetch('/api/collections');
          const data = await res.json();
          if (data.success) {
            setCollections(data.data);
          }
        } else {
          const res = await fetch('/api/products');
          const data = await res.json();
          if (data.success) {
            setProducts(data.data);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [targetType]);

  const productOptions = useMemo(() => products.map(p => ({
    value: p.id,
    label: p.title
  })), [products]);

  const collectionOptions = useMemo(() => collections.map(c => ({
    value: c.id,
    label: c.title
  })), [collections]);

  const filteredProductOptions = useMemo(() => {
    return productOptions.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [productOptions, inputValue]);

  const filteredCollectionOptions = useMemo(() => {
    return collectionOptions.filter(option =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [collectionOptions, inputValue]);

  if (loading) {
    return (
      <InlineStack align="center">
        <Spinner size="small" />
        <Text as="span" variant="bodySm">Loading...</Text>
      </InlineStack>
    );
  }

  if (targetType === 'collection') {
    return (
      <Autocomplete
        options={filteredCollectionOptions}
        selected={value ? [value] : []}
        onSelect={(selected) => {
          onChange(selected[0]);
          const option = collectionOptions.find(opt => opt.value === selected[0]);
          setInputValue(option?.label || '');
        }}
        textField={
          <Autocomplete.TextField
            label="Collection"
            value={inputValue}
            onChange={setInputValue}
            placeholder="Search collections..."
            autoComplete="off"
            prefix={<Icon source={SearchMinor} />}
            error={error}
          />
        }
      />
    );
  }

  if (targetType === 'variant') {
    const selectedProductData = products.find(p => p.id === selectedProduct);
    const variantOptions = useMemo(() => 
      selectedProductData?.variants?.map(v => ({
        value: v.id,
        label: `${v.title} - $${v.price}`
      })) || []
    , [selectedProductData]);

    const filteredVariantOptions = useMemo(() => {
      return variantOptions.filter(option =>
        option.label.toLowerCase().includes(variantInputValue.toLowerCase())
      );
    }, [variantOptions, variantInputValue]);

    return (
      <>
        <Autocomplete
          options={filteredProductOptions}
          selected={selectedProduct ? [selectedProduct] : []}
          onSelect={(selected) => {
            setSelectedProduct(selected[0]);
            onChange('');
            const option = productOptions.find(opt => opt.value === selected[0]);
            setInputValue(option?.label || '');
            setVariantInputValue('');
          }}
          textField={
            <Autocomplete.TextField
              label="Product"
              value={inputValue}
              onChange={setInputValue}
              placeholder="Search products..."
              autoComplete="off"
              prefix={<Icon source={SearchMinor} />}
            />
          }
        />
        <Autocomplete
          options={filteredVariantOptions}
          selected={value ? [value] : []}
          onSelect={(selected) => {
            onChange(selected[0]);
            const option = variantOptions.find(opt => opt.value === selected[0]);
            setVariantInputValue(option?.label || '');
          }}
          textField={
            <Autocomplete.TextField
              label="Variant"
              value={variantInputValue}
              onChange={setVariantInputValue}
              placeholder="Search variants..."
              autoComplete="off"
              prefix={<Icon source={SearchMinor} />}
              disabled={!selectedProduct}
              error={error}
            />
          }
        />
      </>
    );
  }

  return (
    <Autocomplete
      options={filteredProductOptions}
      selected={value ? [value] : []}
      onSelect={(selected) => {
        onChange(selected[0]);
        const option = productOptions.find(opt => opt.value === selected[0]);
        setInputValue(option?.label || '');
      }}
      textField={
        <Autocomplete.TextField
          label="Product"
          value={inputValue}
          onChange={setInputValue}
          placeholder="Search products..."
          autoComplete="off"
          prefix={<Icon source={SearchMinor} />}
          error={error}
        />
      }
    />
  );
}
