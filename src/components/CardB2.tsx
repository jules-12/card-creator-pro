import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Contributor, CardType } from '@/types/contributor';
import { safe, truncName, truncMotoDisplay } from '@/utils/textHelpers';
import logoGauche from '@/assets/logo-gauche.png';
import logoDroit from '@/assets/logo-droit.png';

interface CardB2Props {
  contributor: Contributor;
  cardType?: CardType;
}

const CardB2 = forwardRef<HTMLDivElement, CardB2Props>(
  ({ contributor, cardType = '2_roues' }, ref) => {
    const cardTitle = cardType === '3_roues'
      ? 'CARTE DE RECENSEMENT TAXI – MOTO 3 ROUES'
      : 'CARTE DE RECENSEMENT TAXI – MOTO 2 ROUES';

    // Générer les données du QR Code avec tous les champs (nom complet)
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
        <FlagStripe />

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
          <LogoBox src={logoDroit} alt="République du Bénin" size="10.8mm" />

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

          <LogoBox src={logoGauche} alt="Ville de Cotonou" size="16.2mm" />
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
            {cardTitle}
          </span>
        </div>

        {/* Corps de la carte */}
        <div style={{ flex: 1, display: 'flex', padding: '0 3mm 2mm', minHeight: 0 }}>
          {/* Informations */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3mm' }}>
            <DataRow label="N° NPC" value={safe(contributor.npc)} />
            <DataRow label="Nom Prénoms conducteur" value={truncName(`${safe(contributor.nom)} ${safe(contributor.prenoms)}`.trim())} />
            <DataRow label="Tél" value={safe(contributor.telephone)} />
            <DataRow label="Personne à contacter" value={truncName(safe(contributor.personneContact))} />
            <DataRow label="Tél" value={safe(contributor.telephoneContact)} />
            <DataRow label="Propriétaire" value={truncName(safe(contributor.proprietaire))} />
            <DataRow label="Tél" value={safe(contributor.telephoneProprietaire)} />
            <DataRow label="Résidence" value={safe(contributor.residence).substring(0, 16)} />
            <DataRow label="Caractéristiques Moto" value={truncMotoDisplay(safe(contributor.caracteristiquesMoto))} />
          </div>

          {/* QR Code — position fixe */}
          <div style={{ width: '18mm', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '2mm' }}>
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
        <FlagStripe />
      </div>
    );
  }
);

/** Inline flag stripe for the card (not using BeninFlagStripe to avoid Tailwind class issues in PDF) */
const FlagStripe = () => (
  <div style={{ display: 'flex', width: '100%', height: '0.8mm', flexShrink: 0 }}>
    <div style={{ flex: 1, backgroundColor: 'hsl(153 100% 27%)' }} />
    <div style={{ flex: 1, backgroundColor: 'hsl(48 97% 53%)' }} />
    <div style={{ flex: 1, backgroundColor: 'hsl(354 85% 49%)' }} />
  </div>
);

/** Logo container */
const LogoBox = ({ src, alt, size }: { src: string; alt: string; size: string }) => (
  <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
  </div>
);

/** Single data row */
const DataRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.2 }}>
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
    <span style={{ fontSize: '5.8pt', fontWeight: 800, whiteSpace: 'nowrap' }}>
      {value && value.trim().length > 0 ? value : '–'}
    </span>
  </div>
);

CardB2.displayName = 'CardB2';

export default CardB2;
