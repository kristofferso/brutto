"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { HelpCircle, BookText } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

// Norwegian tax rates for 2025
const TAX_RATES = {
  VAT: 0.25, // 25% standard VAT rate
  CORPORATE_TAX: 0.22, // 22% corporate tax
  DIVIDEND_TAX: 0.378, // 37.8% dividend tax rate
} as const

interface CalculationResult {
  basePrice: number
  priceWithoutVat: number
  priceAfterCorporateTax: number
  netCostToBusiness: number
  dividendTaxCost: number
  totalPersonalCost: number
}

function AnimatedNumber({ value, className }: { value: string; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setIsAnimating(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [value, displayValue])

  return (
    <span className={`${className} transition-all duration-150 ${isAnimating ? "scale-105 text-accent" : "scale-100"}`}>
      {displayValue}
    </span>
  )
}

export function BusinessCalculator() {
  const [price, setPrice] = useState<string>("")
  const [vatDeductible, setVatDeductible] = useState(true)
  const [businessProfitable, setBusinessProfitable] = useState(true)
  const [includeDividendTax, setIncludeDividendTax] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const calculateCosts = (
    basePrice: number,
    canDeductVat: boolean,
    isProfitable: boolean,
    includeDividend: boolean,
  ): CalculationResult => {
    // Start with the input price (including VAT)
    let currentCost = basePrice

    // Step 1: Remove VAT if deductible (price / 1.25 to get price without VAT)
    const priceWithoutVat = canDeductVat ? currentCost / (1 + TAX_RATES.VAT) : currentCost
    if (canDeductVat) {
      currentCost = priceWithoutVat
    }

    // Step 2: Apply corporate tax deduction if profitable (22% tax deduction)
    const corporateTaxSavings = isProfitable ? currentCost * TAX_RATES.CORPORATE_TAX : 0
    const priceAfterCorporateTax = currentCost - corporateTaxSavings

    // Net cost to business
    const netCostToBusiness = priceAfterCorporateTax

    // Step 3: Apply dividend tax deduction if applicable (37.8% tax deduction)
    const dividendTaxSavings = includeDividend ? netCostToBusiness * TAX_RATES.DIVIDEND_TAX : 0
    const finalCostAfterDividendTax = includeDividend ? netCostToBusiness - dividendTaxSavings : netCostToBusiness

    return {
      basePrice,
      priceWithoutVat,
      priceAfterCorporateTax,
      netCostToBusiness: finalCostAfterDividendTax,
      dividendTaxCost: dividendTaxSavings, // This is now the savings amount
      totalPersonalCost: finalCostAfterDividendTax, // Same as net cost when dividend tax is applied
    }
  }

  useEffect(() => {
    console.log("[v0] Input price:", price)
    const cleanedPrice = price.replace(/[^\d.,]/g, "").replace(",", ".")
    console.log("[v0] Cleaned price:", cleanedPrice)
    const numericPrice = Number.parseFloat(cleanedPrice)
    console.log("[v0] Numeric price:", numericPrice)

    if (!isNaN(numericPrice) && numericPrice > 0) {
      const calculatedResult = calculateCosts(numericPrice, vatDeductible, businessProfitable, includeDividendTax)
      setResult(calculatedResult)
    } else {
      console.log("[v0] Invalid price, setting result to null")
      setResult(null)
    }
  }, [price, vatDeductible, businessProfitable, includeDividendTax])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPrice(value)
  }

  return (
  <main className="bg-background p-4">
    <div className="h-svh flex flex-col max-w-[800px] mx-auto gap-6">
      {/* Header */}
      <div className="flex-shrink-0 text-left flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-1 font-mono">Brutto</h1>
          <p className="text-muted-foreground text-xs uppercase font-mono">
            Beregn reelle kostnader for bedriftskjøp
          </p>
        </div>

        {/* Tax rates drawer trigger */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" className="font-mono">
            Satser
              <BookText className="size-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="font-mono">Skattesatser 2025</DrawerTitle>
              <DrawerDescription className="font-mono">Gjeldende skattesatser brukt i beregningene</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <div className="grid gap-4 text-sm font-mono">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                  <span className="font-semibold">Merverdiavgift (MVA)</span>
                  <span className="font-mono font-semibold">25%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                  <span className="font-semibold">Selskapsskatt</span>
                  <span className="font-mono font-semibold">22%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                  <span className="font-semibold">Utbytteskatt</span>
                  <span className="font-mono font-semibold">37,8%</span>
                </div>
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" className="font-mono bg-transparent">
                  Lukk
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Main Content - Split 50/50 */}
          <Card className="h-full p-6 flex flex-col justify-center border-0 shadow-none flex-1">
            <div className="space-y-6">
              <div>
                <Label
                  htmlFor="price"
                  className="text-sm font-semibold uppercase text-foreground mb-3 block font-mono"
                >
                  BRUTTO
                </Label>
                <span className="text-xs">Pris inkl. MVA</span>
                <Input
                  ref={inputRef}
                  id="price"
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="10000"
                  className="h-20 !text-2xl font-mono text-center"
                />
                {price && !isNaN(Number.parseFloat(price.replace(/[^\d.,]/g, "").replace(",", "."))) && (
                  <p className="text-lg text-muted-foreground mt-4 text-center font-mono">
                    {formatCurrency(Number.parseFloat(price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0)}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-semibold uppercase text-foreground font-mono">VALG</h3>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="vat-deductible"
                      checked={vatDeductible}
                      onCheckedChange={setVatDeductible}
                      className="w-5 h-5"
                    />
                    <Label htmlFor="vat-deductible" className="text-sm font-medium cursor-pointer font-mono flex-1">
                      Fradrag for MVA
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="profitable"
                      checked={businessProfitable}
                      onCheckedChange={setBusinessProfitable}
                      className="w-5 h-5"
                    />
                    <Label htmlFor="profitable" className="text-sm font-medium cursor-pointer font-mono flex-1">
                      Bedriften går med overskudd
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="focus:outline-none">
                          <HelpCircle className="size-6 text-muted-foreground cursor-help" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="font-mono text-sm">
                        <p>Hvis bedriften har overskudd kan du trekke fra 22% selskapsskatt på kjøpet</p>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="dividend-tax"
                      checked={includeDividendTax}
                      onCheckedChange={setIncludeDividendTax}
                      className="w-5 h-5"
                    />
                    <Label htmlFor="dividend-tax" className="text-sm font-medium cursor-pointer font-mono flex-1">
                    Ta med utbytteskatt
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="focus:outline-none">
                          <HelpCircle className="size-6 text-muted-foreground cursor-help" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="font-mono text-sm">
                        <p>Viser hva kjøpet ville kostet hvis du tok ut penger fra bedriften for å kjøpe (37,8% utbytteskatt)</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </Card>


          <Card className="h-full p-6 flex flex-col justify-start border-0 shadow-none">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase text-foreground font-mono">
                NETTO
              </h3>
              <span className="text-xs">Pris inkl. MVA</span>

              {result ? (
                <div className="space-y-4">
                  <div className="bg-primary/5 p-6 rounded">
                    <div className="text-center">
                      <p className="text-xs uppercase text-muted-foreground mb-2 font-mono">
                        {includeDividendTax ? "FAKTISK KOSTNAD" : "NETTO KOSTNAD TIL BEDRIFT"}
                      </p>
                      <AnimatedNumber
                        value={formatCurrency(result.netCostToBusiness)}
                        className="text-4xl font-semibold text-primary font-mono block"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">Pris ink. MVA:</span>
                      <AnimatedNumber value={formatCurrency(result.basePrice)} className="font-mono" />
                    </div>

                    {vatDeductible && (
                      <div className="flex justify-between text-sm text-green-600 font-mono">
                        <span>Etter MVA fradrag:</span>
                        <AnimatedNumber value={formatCurrency(result.priceWithoutVat)} className="font-mono" />
                      </div>
                    )}

                    {businessProfitable && (
                      <div className="flex justify-between text-sm text-green-600 font-mono">
                        <span>Etter skattefradrag (22%):</span>
                        <AnimatedNumber value={formatCurrency(result.priceAfterCorporateTax)} className="font-mono" />
                      </div>
                    )}

                    {includeDividendTax && (
                      <div className="flex justify-between text-sm text-green-600 font-mono">
                        <span>Etter utbytteskatt fradrag (37,8%):</span>
                        <AnimatedNumber value={formatCurrency(result.netCostToBusiness)} className="font-mono" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm font-mono">Skriv inn en pris for å se beregningen</p>
                </div>
              )}
            </div>
          </Card>
      </div>
    </main>
  )
}
