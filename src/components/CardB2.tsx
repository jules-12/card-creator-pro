import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Contributor } from '@/types/contributor';
import logoGauche from '@/assets/logo-gauche.png';
import logoDroit from '@/assets/logo-droit.png';

interface CardB2Props {
  contributor: Contributor;
}

const CardB2 = forwardRef<HTMLDivElement, CardB2Props>(
  ({ contributor }, ref) => {
    const safe = (v: string | null | undefined) => {
      const s = (v ?? '').toString().trim();
      return s.length > 0 ? s : '–';
    };

    // Générer les données du QR Code avec tous les champs
    const qrData = [
      `N° NPC: ${safe(contributor.npc)}`,
      `Nom & Prénoms: ${safe(contributor.nom)} ${safe(contributor.prenoms)}`,
      `Tél conducteur: ${safe(contributor.telephone)}`,
      `Personne à contacter: ${safe(contributor.personneContact)}`,
      `Tél contact: ${safe(contributor.telephoneContact)}`,
      `Propriétaire: ${safe(contributor.proprietaire)}`,
      `Tél propriétaire: ${safe(contributor.telephoneProprietaire)}`,
      `Résidence: ${safe(contributor.residence)}`,
      `Caract. Moto: ${safe(contributor.caracteristiquesMoto)}`,
    ].join('\n');

    return (
      <div
        ref={ref}
        className="card-b2"
        style={{
          width: '85.6mm',
          height: '54mm',
          fontFamily: "'Open Sans', sans-serif",
          background: 'linear-gradient(135deg, hsl(165 40% 85%) 0%, hsl(200 60% 80%) 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        }}
      >
        {/* Bande supérieure du drapeau */}
        <div style={{ display: 'flex', width: '100%', height: '0.8mm', flexShrink: 0 }}>
          <div style={{ flex: 1, backgroundColor: 'hsl(153 100% 27%)' }} />
          <div style={{ flex: 1, backgroundColor: 'hsl(48 97% 53%)' }} />
          <div style={{ flex: 1, backgroundColor: 'hsl(354 85% 49%)' }} />
        </div>

        {/* En-tête avec logos */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.8mm 3mm',
            background: 'linear-gradient(180deg, hsl(210 100% 35%) 0%, hsl(210 100% 25%) 100%)',
            flexShrink: 0,
          }}
        >
          {/* Logo national (gauche) */}
          <div style={{ width: '10.8mm', height: '10.8mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={logoDroit}
              alt="République du Bénin"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Titres centraux */}
          <div style={{ flex: 1, textAlign: 'center', padding: '0 2mm' }}>
            <div style={{ color: 'white', fontSize: '7pt', fontWeight: 800, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.5px' }}>
              DÉPARTEMENT DU LITTORAL
            </div>
            <div style={{ color: 'white', fontSize: '6pt', fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>
              MAIRIE DE COTONOU
            </div>
            <div style={{ color: 'white', fontSize: '4.5pt', fontWeight: 500, fontStyle: 'Montserrat, sans-serif' }}>
              Direction des Affaires Administratives et Financières DAAF
            </div>
            <div style={{ color: 'white', fontSize: '4.5pt', fontWeight: 500 }}>
              RÉGIE PRINCIPALE DES RECETTES NON FISCALES
            </div>
          </div>

          {/* Logo Cotonou (droite) — 150% de 9mm = 13.5mm */}
          <div style={{ width: '16.2mm', height: '16.2mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={logoGauche}
              alt="Ville de Cotonou"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Titre principal */}
        <div style={{ textAlign: 'center', padding: '0.25mm 0', marginTop: '-2.5mm', flexShrink: 0 }}>
          <span
            style={{
              color: 'hsl(354 85% 49%)',
              fontSize: '7pt',
              fontWeight: 800,
              fontFamily: 'Montserrat, sans-serif',
              letterSpacing: '0.5px',
            }}
          >
            CARTE DE RECENSEMENT TAXI – MOTO
          </span>
        </div>

        {/* Corps de la carte */}
        <div style={{ flex: 1, display: 'flex', padding: '0 3mm 2mm', minHeight: 0, position: 'relative' }}>
          {/* Informations - largeur fixe pour ne jamais pousser le QR */}
          <div style={{ width: 'calc(100% - 20mm)', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3mm', overflow: 'hidden' }}>
            <DataRow label="N° NPC" value={safe(contributor.npc)} />
            <DataRow label="Nom Prénoms conducteur" value={`${safe(contributor.nom)} ${safe(contributor.prenoms)}`.trim()} />
            <DataRow label="Tél" value={safe(contributor.telephone)} />
            <DataRow label="Personne à contacter" value={safe(contributor.personneContact)} />
            <DataRow label="Tél" value={safe(contributor.telephoneContact)} />
            <DataRow label="Propriétaire" value={safe(contributor.proprietaire)} />
            <DataRow label="Tél" value={safe(contributor.telephoneProprietaire)} />
            <DataRow label="Résidence" value={safe(contributor.residence)} />
            <DataRow label="Caractéristiques Moto" value={safe(contributor.caracteristiquesMoto)} />
          </div>

          {/* QR Code - position fixe absolue */}
          <div style={{ position: 'absolute', right: '0mm', top: '50%', transform: 'translateY(-50%)', width: '16mm', height: '16mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QRCodeSVG
              value={qrData}
              size={55}
              level="M"
              includeMargin={false}
              bgColor="transparent"
              fgColor="hsl(0 0% 0%)"
            />
          </div>
        </div>

        {/* Pied de page */}
        <div style={{ padding: '0.6mm 3mm 1.8mm', flexShrink: 0 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '4.2pt', lineHeight: 1.3, color: 'hsl(210 100% 35%)' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{ marginRight: '1mm' }}>•</span>
              <span>Adresse postale : 03 BP : 1777 Cotonou - BÉNIN .Téléphone : +229 21 30 95 69</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{ marginRight: '1mm' }}>•</span>
              <span>E-mail : mairiecotonou.infos@gouv.bj .Site web : www.cotonou.mairie.bj</span>
            </li>
          </ul>
        </div>

        {/* Bande inférieure du drapeau */}
        <div style={{ display: 'flex', width: '100%', height: '0.8mm', flexShrink: 0 }}>
          <div style={{ flex: 1, backgroundColor: 'hsl(153 100% 27%)' }} />
          <div style={{ flex: 1, backgroundColor: 'hsl(48 97% 53%)' }} />
          <div style={{ flex: 1, backgroundColor: 'hsl(354 85% 49%)' }} />
        </div>
      </div>
    );
  }
);

// Fonction pour calculer la taille de police adaptative
const getAdaptiveFontSize = (value: string): string => {
  const len = value.length;
  if (len > 40) return '4pt';
  if (len > 30) return '4.6pt';
  if (len > 20) return '5.2pt';
  return '5.8pt';
};

// Composant pour une ligne de données
const DataRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.2, maxWidth: '100%' }}>
    <span
      style={{
        color: 'hsl(210 100% 35%)',
        fontWeight: 800,
        fontSize: '5.8pt',
        fontFamily: 'Montserrat, sans-serif',
        width: '33mm',
        flexShrink: 0,
        paddingRight: '1.5mm',
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
      }}
    >
      {label} :
    </span>
    <span style={{
      fontSize: getAdaptiveFontSize(value),
      fontWeight: 800,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
    }}>
      {value && value.trim().length > 0 ? value : '–'}
    </span>
  </div>
);

CardB2.displayName = 'CardB2';

export default CardB2;
