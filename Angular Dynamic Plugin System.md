# Cahier des charges – Angular Dynamic Plugin System

## 1. Contexte et objectif

Les applications Angular modernes, notamment dans les contextes SaaS, multi-tenant et plateformes extensibles, souffrent d’un manque de mécanisme standard permettant de charger, activer ou désactiver des fonctionnalités dynamiquement à runtime, sans rebuild ni redéploiement.

L’objectif de cette bibliothèque est de fournir un **système de plugins Angular dynamique**, simple à intégrer, orienté produit, et indépendant de toute infrastructure backend dans sa version initiale.

---

## 2. Objectifs principaux

* Permettre le chargement dynamique de plugins Angular à runtime
* Offrir une API claire et stable pour le host et les plugins
* Garantir une isolation logique entre l’application hôte et les plugins
* Faciliter l’activation/désactivation de fonctionnalités sans redéploiement
* Être compatible avec les versions modernes d’Angular (standalone, signals)

---

## 3. Périmètre du projet (V1 – MVP)

### Inclus

* Bibliothèque Angular distribuée via npm
* Chargement dynamique de plugins via `import()` ou bundle distant
* Enregistrement et gestion du cycle de vie des plugins
* Injection des plugins dans des zones dédiées de l’UI
* API TypeScript documentée
* Support des composants standalone

### Exclus (hors V1)

* Backend de gestion des plugins
* Marketplace de plugins
* Sandbox de sécurité avancée (iframe)
* Billing, analytics, permissions avancées

---

## 4. Définition d’un plugin

Un plugin est défini comme :

* Un composant Angular standalone
* Un manifeste de configuration
* Une API d’entrée standardisée

### Manifeste de plugin (exemple)

```ts
export const PluginManifest = {
  name: 'invoice',
  version: '1.0.0',
  entryComponent: InvoicePluginComponent
};
```

---

## 5. Architecture fonctionnelle

### Composants principaux

* **PluginManager** : service central de chargement et gestion des plugins
* **PluginRegistry** : registre interne des plugins chargés
* **PluginOutletComponent** : zone UI destinée à afficher un plugin
* **PluginInjector** : injector Angular dédié par plugin

### Flux de fonctionnement

1. L’application hôte démarre
2. Une configuration déclare les plugins à charger
3. Le PluginManager charge dynamiquement le plugin
4. Le plugin est enregistré dans le registry
5. Le plugin est injecté dans un PluginOutlet

---

## 6. API publique (V1)

### Côté Host

```ts
pluginManager.load({
  name: 'invoice',
  entry: () => import('plugin-invoice')
});
```

```html
<plugin-outlet plugin="invoice"></plugin-outlet>
```

### Côté Plugin

```ts
export class InvoicePluginComponent implements PluginLifecycle {
  onLoad(ctx: PluginContext) {}
  onDestroy() {}
}
```

---

## 7. Contraintes techniques

* Angular >= 16
* Support des composants standalone
* TypeScript strict
* Aucune dépendance backend obligatoire
* Compatible lazy loading
* Pas de dépendance obligatoire à NgRx

---

## 8. Qualité, performance et maintenabilité

* Chargement à la demande (lazy runtime)
* Aucun impact sur le bundle initial
* Gestion propre du cycle de vie Angular
* API stable et versionnée
* Documentation claire et exemples fournis

---

## 9. Sécurité (V1)

* Isolation logique via injector dédié
* Pas d’accès implicite aux services du host
* Accès explicite via PluginContext

---

## 10. Livrables

* Package npm `@angular-dynamic/plugin-system`
* Documentation (README, exemples)
* Application de démonstration
* Guide de création de plugin

---

## 11. Roadmap indicative

### V1 (MVP)

* Loader runtime
* Plugin outlet
* API host/plugin

### V2

* Permissions
* Router dynamique
* Configuration distante

### V3

* Sandbox
* Marketplace
* Analytics

---

## 12. Critères de succès

* Intégration simple dans une app Angular existante
* Temps d’adoption < 30 minutes
* Capacité à activer/désactiver un plugin sans rebuild
* Feedback positif de la communauté Angular

---

Fin du cahier des charges.
