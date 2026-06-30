#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "lista_sequencial.h"

/* ================================================================
   BASE — Atividade 4 Voldemort
   Lista sequencial com array dinâmico, inserção não-ordenada.
   ================================================================ */

void criar(LISTA *lst, int max) {
    lst->dados   = (int *) malloc(max * sizeof(int));
    lst->tamanho = 0;
    lst->MAX     = max;
}

void destruir(LISTA *lst) {
    free(lst->dados);
    lst->dados   = NULL;
    lst->tamanho = 0;
    lst->MAX     = 0;
}

void inserir(LISTA *lst, int valor) {
    if (lst->tamanho == lst->MAX) {
        printf("Lista cheia. Impossível inserir %d.\n", valor);
        return;
    }
    lst->dados[lst->tamanho] = valor;
    lst->tamanho++;
}

void exibir(LISTA *lst) {
    printf("[ ");
    for (int i = 0; i < lst->tamanho; i++)
        printf("%d ", lst->dados[i]);
    printf("] (tamanho=%d, MAX=%d)\n", lst->tamanho, lst->MAX);
}

int buscar(LISTA *lst, int valor) {
    for (int i = 0; i < lst->tamanho; i++)
        if (lst->dados[i] == valor)
            return i;
    return -1;
}

/* desloca elementos para fechar o buraco deixado pelo índice removido */
void remover_idx(LISTA *lst, int idx) {
    if (idx < 0 || idx >= lst->tamanho) return;
    for (int i = idx; i < lst->tamanho - 1; i++)
        lst->dados[i] = lst->dados[i + 1];
    lst->tamanho--;
}

/* ================================================================
   Q1 — Quirrell
   Conta quantas vezes 'valor' aparece na lista.
   ================================================================ */
int contar(LISTA *lst, int valor) {
    int count = 0;
    for (int i = 0; i < lst->tamanho; i++)
        if (lst->dados[i] == valor)
            count++;
    return count;
}

/* ================================================================
   Q2 — Quirrell
   Remove e retorna o último elemento. Exige ao menos 1 elemento.
   ================================================================ */
int pop(LISTA *lst) {
    if (lst->tamanho == 0) {
        printf("Lista vazia. Impossível fazer pop.\n");
        return -1;  /* valor sentinela — professor pode preferir assert() */
    }
    lst->tamanho--;
    return lst->dados[lst->tamanho];
}

/* ================================================================
   Q3 — Olho-Tonto
   Insere 'valor' na posição 'pos' (0-based).
   Posição válida: 0 <= pos <= tamanho  (inserir no fim é válido).
   Desloca os elementos à direita para abrir espaço.
   ================================================================ */
void inserirPos(LISTA *lst, int pos, int valor) {
    if (pos < 0 || pos > lst->tamanho) {
        printf("Posição inválida: %d\n", pos);
        return;
    }
    if (lst->tamanho == lst->MAX) {
        printf("Lista cheia. Impossível inserir na posição %d.\n", pos);
        return;
    }
    /* abre espaço deslocando da direita para a esquerda */
    for (int i = lst->tamanho; i > pos; i--)
        lst->dados[i] = lst->dados[i - 1];
    lst->dados[pos] = valor;
    lst->tamanho++;
}

/* ================================================================
   Q4 — Dolores
   Copia lst2 para lst1.
   lst1 precisa ter MAX suficiente; se não tiver, não faz nada.
   A memória de lst1 já deve estar alocada (criar foi chamado).
   ================================================================ */
void copiar(LISTA *lst1, LISTA *lst2) {
    if (lst1->MAX < lst2->tamanho) {
        printf("lst1 não tem capacidade para copiar lst2.\n");
        return;
    }
    memcpy(lst1->dados, lst2->dados, lst2->tamanho * sizeof(int));
    lst1->tamanho = lst2->tamanho;
}

/* ================================================================
   Q5 — Dolores
   Estende lst1 anexando os elementos de lst2 ao seu final.
   Verifica se há espaço suficiente em lst1.
   ================================================================ */
void estender(LISTA *lst1, LISTA *lst2) {
    if (lst1->tamanho + lst2->tamanho > lst1->MAX) {
        printf("lst1 não tem capacidade para receber todos os elementos de lst2.\n");
        return;
    }
    memcpy(lst1->dados + lst1->tamanho,
           lst2->dados,
           lst2->tamanho * sizeof(int));
    lst1->tamanho += lst2->tamanho;
}

/* ================================================================
   Q6 — Dolores
   Armazena em lst1 os elementos de lst2 na ordem inversa.
   Elementos anteriores de lst1 são descartados (free + realloc não
   necessário aqui pois só sobrescrevemos; mas zeramos o tamanho).
   Verifica se lst1 suporta receber lst2.
   ================================================================ */
void inverter(LISTA *lst1, LISTA *lst2) {
    if (lst1->MAX < lst2->tamanho) {
        printf("lst1 não tem capacidade para receber lst2 invertida.\n");
        return;
    }
    lst1->tamanho = 0;
    for (int i = lst2->tamanho - 1; i >= 0; i--) {
        lst1->dados[lst1->tamanho] = lst2->dados[i];
        lst1->tamanho++;
    }
}

/* ================================================================
   Q7 — Dolores
   Redimensiona o array interno para 'novoMAX'.
   Não permite reduzir se isso causaria perda de elementos.
   ================================================================ */
void redimensionar(LISTA *lst, int novoMAX) {
    if (novoMAX < lst->tamanho) {
        printf("Redimensionar para %d causaria perda de dados (tamanho atual: %d).\n",
               novoMAX, lst->tamanho);
        return;
    }
    int *novo = (int *) realloc(lst->dados, novoMAX * sizeof(int));
    if (novo == NULL) {
        printf("Falha ao realocar memória.\n");
        return;
    }
    lst->dados = novo;
    lst->MAX   = novoMAX;
}

/* ================================================================
   Q8 — Dolores
   Versões v2 que usam redimensionar() quando necessário,
   eliminando a restrição de capacidade fixa.
   ================================================================ */

void inserirv2(LISTA *lst, int valor) {
    if (lst->tamanho == lst->MAX)
        redimensionar(lst, lst->MAX * 2);  /* dobra capacidade */
    if (lst->tamanho == lst->MAX) return;  /* falhou o realloc */
    lst->dados[lst->tamanho++] = valor;
}

void inserirPosv2(LISTA *lst, int pos, int valor) {
    if (pos < 0 || pos > lst->tamanho) {
        printf("Posição inválida: %d\n", pos);
        return;
    }
    if (lst->tamanho == lst->MAX)
        redimensionar(lst, lst->MAX * 2);
    if (lst->tamanho == lst->MAX) return;
    for (int i = lst->tamanho; i > pos; i--)
        lst->dados[i] = lst->dados[i - 1];
    lst->dados[pos] = valor;
    lst->tamanho++;
}

void copiarv2(LISTA *lst1, LISTA *lst2) {
    if (lst1->MAX < lst2->tamanho)
        redimensionar(lst1, lst2->tamanho);
    if (lst1->MAX < lst2->tamanho) return;
    memcpy(lst1->dados, lst2->dados, lst2->tamanho * sizeof(int));
    lst1->tamanho = lst2->tamanho;
}

void estenderv2(LISTA *lst1, LISTA *lst2) {
    int necessario = lst1->tamanho + lst2->tamanho;
    if (necessario > lst1->MAX)
        redimensionar(lst1, necessario);
    if (necessario > lst1->MAX) return;
    memcpy(lst1->dados + lst1->tamanho,
           lst2->dados,
           lst2->tamanho * sizeof(int));
    lst1->tamanho += lst2->tamanho;
}

void inverterv2(LISTA *lst1, LISTA *lst2) {
    if (lst1->MAX < lst2->tamanho)
        redimensionar(lst1, lst2->tamanho);
    if (lst1->MAX < lst2->tamanho) return;
    lst1->tamanho = 0;
    for (int i = lst2->tamanho - 1; i >= 0; i--)
        lst1->dados[lst1->tamanho++] = lst2->dados[i];
}

/* ================================================================
   Q9 — Voldemort
   Ordena a lista em ordem crescente (insertion sort).
   Escolha: insertion sort é O(n²) mas estável e didático.
   Para listas pequenas é prático; para grandes use quicksort/mergesort.
   ================================================================ */
void ordenar(LISTA *lst) {
    for (int i = 1; i < lst->tamanho; i++) {
        int chave = lst->dados[i];
        int j = i - 1;
        while (j >= 0 && lst->dados[j] > chave) {
            lst->dados[j + 1] = lst->dados[j];
            j--;
        }
        lst->dados[j + 1] = chave;
    }
}
