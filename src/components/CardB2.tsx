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
    // Générer les données du QR Code avec tous les champs
    const qrData = [
      `N° NPC: ${contributor.npc}`,
      `Nom & Prénoms: ${contributor.nom} ${contributor.prenoms}`,
      `Tél conducteur: ${contributor.telephone}`,
      `Personne à contacter: ${contributor.personneContact}`,
      `Tél contact: ${contributor.telephoneContact}`,
      `Propriétaire: ${contributor.proprietaire}`,
      `Tél propriétaire: ${contributor.telephoneProprietaire}`,
      `Résidence: ${contributor.residence}`,
      `Caract. Moto: ${contributor.caracteristiquesMoto}`,
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
        <div style={{ display: 'flex', width: '100%', height: '2.5mm', flexShrink: 0 }}>
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
            padding: '1.5mm 3mm',
            background: 'linear-gradient(180deg, hsl(210 100% 35%) 0%, hsl(210 100% 25%) 100%)',
            flexShrink: 0,
          }}
        >
          {/* Logo national (gauche) */}
          <div style={{ width: '9mm', height: '9mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div style={{ color: 'white', fontSize: '4.5pt', fontWeight: 500, fontStyle: 'italic' }}>
              Direction des Affaires Administratives et Financières DAAF
            </div>
            <div style={{ color: 'white', fontSize: '4.5pt', fontWeight: 500 }}>
              RÉGIE PRINCIPALE DES RECETTES NON FISCALES
            </div>
          </div>

          {/* Logo Cotonou (droite) */}
          <div style={{ width: '9mm', height: '9mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={logoGauche}
              alt="Ville de Cotonou"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Titre principal */}
        <div style={{ textAlign: 'center', padding: '1mm 0', flexShrink: 0 }}>
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
        <div style={{ flex: 1, display: 'flex', padding: '0 3mm 1mm', minHeight: 0 }}>
          {/* Informations */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3mm' }}>
            <DataRow label="N° NPC" value={contributor.npc} />
            <DataRow label="Nom Prénoms conducteur" value={`${contributor.nom} ${contributor.prenoms}`} />
            <DataRow label="Tél" value={contributor.telephone} />
            <DataRow label="Personne à contacter" value={contributor.personneContact} />
            <DataRow label="Tél" value={contributor.telephoneContact} />
            <DataRow label="Propriétaire" value={contributor.proprietaire} />
            <DataRow label="Tél" value={contributor.telephoneProprietaire} />
            <DataRow label="Résidence" value={contributor.residence} />
            <DataRow label="Caractéristiques Moto" value={contributor.caracteristiquesMoto} />
          </div>

          {/* QR Code */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '2mm' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5mm', borderRadius: '1mm', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
              <QRCodeSVG
                value={qrData}
                size={55}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div style={{ padding: '0.8mm 3mm', flexShrink: 0 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '4pt', color: 'hsl(210 100% 35%)' }}>
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
        <div style={{ display: 'flex', width: '100%', height: '2.5mm', flexShrink: 0 }}>
          <div style={{ flex: 1, backgroundColor: 'hsl(153 100% 27%)' }} />
          <div style={{ flex: 1, backgroundColor: 'hsl(48 97% 53%)' }} />
          <div style={{ flex: 1, backgroundColor: 'hsl(354 85% 49%)' }} />
        </div>
      </div>
    );
  }
);

// Composant pour une ligne de données
const DataRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.2 }}>
    <span
      style={{
        color: 'hsl(210 100% 35%)',
        fontWeight: 600,
        fontSize: '5pt',
        fontFamily: 'Montserrat, sans-serif',
        minWidth: '28mm',
        flexShrink: 0,
      }}
    >
      {label}:
    </span>
    <span style={{ fontSize: '5pt', fontWeight: 600 }}>{value}</span>
  </div>
);

CardB2.displayName = 'CardB2';

export default CardB2;
