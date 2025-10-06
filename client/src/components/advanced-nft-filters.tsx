import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Filter, X, Search, TrendingUp, DollarSign, Star, User, Clock } from "lucide-react";

interface FilterState {
  search: string;
  priceRange: [number, number];
  collections: string[];
  creators: string[];
  rarity: string;
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  dateRange: string;
  status: string[];
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

const collections: FilterOption[] = [
  { value: 'mad-lads', label: 'Mad Lads', count: 10000 },
  { value: 'degods', label: 'DeGods', count: 10000 },
  { value: 'solana-monkey-business', label: 'Solana Monkey Business', count: 5000 },
  { value: 'claynosaurz', label: 'Claynosaurz', count: 10000 },
  { value: 'froganas', label: 'Froganas', count: 5555 },
  { value: 'lil-chiller', label: 'Lil Chiller', count: 3333 },
  { value: 'retardio-cousins', label: 'Retardio Cousins', count: 4444 },
  { value: 'y00ts', label: 'y00ts', count: 15000 }
];

const creators: FilterOption[] = [
  { value: 'backpack-team', label: 'Backpack Team', count: 10000 },
  { value: 'de-labs', label: 'De Labs', count: 25000 },
  { value: 'tee', label: 'Tee', count: 5555 },
  { value: 'solanamonkey', label: 'SolanaMonkey', count: 5000 },
  { value: 'claynosaurz-studio', label: 'Claynosaurz Studio', count: 10000 }
];

const categories: FilterOption[] = [
  { value: 'pfp', label: 'Profile Pictures', count: 45000 },
  { value: 'art', label: 'Digital Art', count: 15000 },
  { value: 'gaming', label: 'Gaming', count: 8000 },
  { value: 'utility', label: 'Utility', count: 12000 },
  { value: 'collectibles', label: 'Collectibles', count: 20000 }
];

const rarities: FilterOption[] = [
  { value: 'common', label: 'Common', count: 35000 },
  { value: 'uncommon', label: 'Uncommon', count: 20000 },
  { value: 'rare', label: 'Rare', count: 8000 },
  { value: 'epic', label: 'Epic', count: 3000 },
  { value: 'legendary', label: 'Legendary', count: 500 }
];

const sortOptions: FilterOption[] = [
  { value: 'price', label: 'Price' },
  { value: 'name', label: 'Name' },
  { value: 'date', label: 'Date Listed' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'popularity', label: 'Popularity' }
];

interface AdvancedNFTFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
}

export default function AdvancedNFTFilters({ onFiltersChange, initialFilters = {} }: AdvancedNFTFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priceRange: [0, 100],
    collections: [],
    creators: [],
    rarity: '',
    category: '',
    sortBy: 'popularity',
    sortOrder: 'desc',
    dateRange: 'all',
    status: ['listed'],
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (filters.search) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100) count++;
    if (filters.collections.length > 0) count++;
    if (filters.creators.length > 0) count++;
    if (filters.rarity) count++;
    if (filters.category) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.status.length !== 1 || filters.status[0] !== 'listed') count++;
    
    setActiveFiltersCount(count);
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'collections' | 'creators' | 'status', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      priceRange: [0, 100],
      collections: [],
      creators: [],
      rarity: '',
      category: '',
      sortBy: 'popularity',
      sortOrder: 'desc',
      dateRange: 'all',
      status: ['listed']
    });
  };

  const clearSpecificFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'search':
        updateFilter('search', '');
        break;
      case 'priceRange':
        updateFilter('priceRange', [0, 100]);
        break;
      case 'collections':
        if (value) toggleArrayFilter('collections', value);
        break;
      case 'creators':
        if (value) toggleArrayFilter('creators', value);
        break;
      case 'rarity':
        updateFilter('rarity', '');
        break;
      case 'category':
        updateFilter('category', '');
        break;
      case 'dateRange':
        updateFilter('dateRange', 'all');
        break;
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700 mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-white">Advanced Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-purple-600 text-white">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 hover:text-white">
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        <CardDescription className="text-gray-400">
          Filter through {collections.reduce((sum, col) => sum + (col.count || 0), 0).toLocaleString()} authentic Solana NFTs
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-white flex items-center">
            <Search className="w-4 h-4 mr-2 text-purple-400" />
            Search NFTs
          </Label>
          <div className="relative">
            <Input
              placeholder="Search by name, description, or traits..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="space-y-2">
            <Label className="text-white">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="bg-purple-600 text-white">
                  Search: {filters.search}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 hover:bg-purple-700"
                    onClick={() => clearSpecificFilter('search')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100) && (
                <Badge variant="secondary" className="bg-green-600 text-white">
                  Price: {filters.priceRange[0]}-{filters.priceRange[1]} SOL
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 hover:bg-green-700"
                    onClick={() => clearSpecificFilter('priceRange')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {filters.collections.map(collection => (
                <Badge key={collection} variant="secondary" className="bg-blue-600 text-white">
                  {collections.find(c => c.value === collection)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 hover:bg-blue-700"
                    onClick={() => clearSpecificFilter('collections', collection)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
              {filters.creators.map(creator => (
                <Badge key={creator} variant="secondary" className="bg-orange-600 text-white">
                  {creators.find(c => c.value === creator)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 hover:bg-orange-700"
                    onClick={() => clearSpecificFilter('creators', creator)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}
              {filters.rarity && (
                <Badge variant="secondary" className="bg-yellow-600 text-white">
                  {rarities.find(r => r.value === filters.rarity)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 hover:bg-yellow-700"
                    onClick={() => clearSpecificFilter('rarity')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {filters.category && (
                <Badge variant="secondary" className="bg-indigo-600 text-white">
                  {categories.find(c => c.value === filters.category)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 hover:bg-indigo-700"
                    onClick={() => clearSpecificFilter('category')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {isExpanded && (
          <>
            <Separator className="bg-gray-700" />

            {/* Price Range */}
            <div className="space-y-4">
              <Label className="text-white flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                Price Range (SOL)
              </Label>
              <div className="px-2">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value)}
                  max={100}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>{filters.priceRange[0]} SOL</span>
                  <span>{filters.priceRange[1]} SOL</span>
                </div>
              </div>
            </div>

            {/* Collections */}
            <div className="space-y-2">
              <Label className="text-white">Collections</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {collections.map(collection => (
                  <div key={collection.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={collection.value}
                      checked={filters.collections.includes(collection.value)}
                      onCheckedChange={() => toggleArrayFilter('collections', collection.value)}
                    />
                    <Label
                      htmlFor={collection.value}
                      className="text-sm text-gray-300 flex-1 cursor-pointer"
                    >
                      {collection.label}
                      <span className="text-xs text-gray-500 ml-1">({collection.count?.toLocaleString()})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Creators */}
            <div className="space-y-2">
              <Label className="text-white flex items-center">
                <User className="w-4 h-4 mr-2 text-orange-400" />
                Creators
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {creators.map(creator => (
                  <div key={creator.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={creator.value}
                      checked={filters.creators.includes(creator.value)}
                      onCheckedChange={() => toggleArrayFilter('creators', creator.value)}
                    />
                    <Label
                      htmlFor={creator.value}
                      className="text-sm text-gray-300 flex-1 cursor-pointer"
                    >
                      {creator.label}
                      <span className="text-xs text-gray-500 ml-1">({creator.count?.toLocaleString()})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Category and Rarity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">Category</Label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="">Any category</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label} ({category.count?.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-400" />
                  Rarity
                </Label>
                <Select value={filters.rarity} onValueChange={(value) => updateFilter('rarity', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Any rarity" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="">Any rarity</SelectItem>
                    {rarities.map(rarity => (
                      <SelectItem key={rarity.value} value={rarity.value}>
                        {rarity.label} ({rarity.count?.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-purple-400" />
                  Sort By
                </Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Order</Label>
                <Select 
                  value={filters.sortOrder} 
                  onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="desc">High to Low</SelectItem>
                    <SelectItem value="asc">Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-white flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-400" />
                Listed Date
              </Label>
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Past week</SelectItem>
                  <SelectItem value="month">Past month</SelectItem>
                  <SelectItem value="3months">Past 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}