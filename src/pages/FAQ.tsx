import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, HelpCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface FAQItem {
  id: string;
  categoria: string;
  pergunta: string;
  resposta: string;
  ordem: number;
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar FAQ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(faqs.map(faq => faq.categoria)));

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.pergunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.resposta.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || faq.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    if (!acc[faq.categoria]) {
      acc[faq.categoria] = [];
    }
    acc[faq.categoria].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Central de Ajuda</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Perguntas Frequentes
          </h1>
          <p className="text-muted-foreground text-lg">
            Encontre respostas rápidas para suas dúvidas sobre o sistema
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-background/60 backdrop-blur-sm border-primary/20">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar nas perguntas frequentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer hover:scale-105 transition-transform px-4 py-2"
            onClick={() => setSelectedCategory(null)}
          >
            Todas
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer hover:scale-105 transition-transform px-4 py-2"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        {/* FAQ Content */}
        {Object.entries(groupedFaqs).map(([categoria, items]) => (
          <Card key={categoria} className="mb-6 bg-background/60 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ChevronRight className="h-5 w-5 text-primary" />
                {categoria}
              </CardTitle>
              <CardDescription>{items.length} perguntas</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {items.map((faq, index) => (
                  <AccordionItem key={faq.id} value={`item-${index}`}>
                    <AccordionTrigger className="text-left hover:text-primary transition-colors">
                      {faq.pergunta}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.resposta}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {filteredFaqs.length === 0 && (
          <Card className="bg-background/60 backdrop-blur-sm border-primary/20">
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                Nenhuma pergunta encontrada com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact Card */}
        <Card className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Não encontrou o que procura?</h3>
            <p className="text-muted-foreground mb-4">
              Entre em contato com o suporte técnico ou administrador do sistema para obter ajuda adicional.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;
