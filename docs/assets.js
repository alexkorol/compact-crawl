// compact-crawl/assets.js - Game assets and configuration
const CONFIG = {
    display: {
        fontSizeBase: 20,
        fontFamily: "monospace",
        forceSquareRatio: true,
        bg: "#0b1024",
        fg: "#e9ecff"
    },
    fov: {
        radius: 8,
        algorithm: "precise"
    },
    colors: {
        wall: {
            visible: "#7ef3ff",
            explored: "#314763"
        },
        floor: {
            visible: "#0f172e",
            explored: "#0a0f21"
        },
        entities: {
            player: "#7ef3ff",
            monster: {
                rat: "#f28f6b",
                snake: "#60d394",
                goblin: "#7ad6c4",
                orc: "#9ac46d",
                troll: "#f26f8b"
            },
            item: {
                potion: "#ffb25f",
                weapon: "#d4d9f5",
                armor: "#a0e3ff",
                scroll: "#c792ff",
                food: "#ff8b6a"
            }
        },
        ui: {
            text: "#e9ecff",
            highlight: "#7ef3ff",
            warning: "#ff8b6a",
            info: "#c792ff"
        }
    },
    audio: {
        masterVolume: 0.35,
        cues: {
            hit: {
                src: 'data:audio/wav;base64,' +
                    'UklGRl4RAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YToRAAAAAJoFHQt0EIkVRxqcHnUixSV8KJEq+iuzLLgsCSyqKp8o8CWpItceiRrRFcAQ' +
                    'bAvrBVEAt/oy9djvv+r75aDhv91o2qfXidUW1FPTRNPo0z7VP9fl2SPd7uA15ejp9O5F9MT5Xf/3BH8K3A/5FMIZJB4MImwlNShcKtorpyzALCYs2iriKEYm' +
                    'ECNNHwwbXxZXEQoMjAb1AFr70fVx8E/rgeYZ4inewdrv177VN9Rg0zzTzNMO1fzWkNm93Hngs+Rb6V7up/Mj+br+VQTgCUMPaBQ8GaodoSERJewnJiq3K5ks' +
                    'xyxBLAkrJCmaJnUjwR+OG+wW7RGnDC4HmAH8+3D2CvHh6wjnk+KV3h3bOtj21VvUcNM307PT4dS81j3ZWdwF4DLkzujI7QvzgfgW/rIDQAmpDtYTtBgvHTQh' +
                    'tCShJ+4pkiuILMosWSw1K2Qp7CbYIzQgDhx3F4MSQw3PBzsCn/wQ96Xxc+yQ5w/jA99724bYL9aB1IHTNdOc07bUfdbs2PfblN+z40PoM+1v8uH3c/0PA6AI' +
                    'Dg5DEysYshzGIFYkUyezKWsrdSzMLG8sXyuhKTwnOSSkII0cAhgXE98NcAjeAkL9sPdA8gftGuiN43Lf2tvU2GvWqdSV0zTTh9ON1EHWndiX2yTfNeO555/s' +
                    '0/FA99D8bAL/B3INrxKhFzQcViD1IwQndilCK2AsyyyCLIcr3CmKJ5gkEyEKHYsYqhN6DhAJgQPl/VH43PKb7aToDOTj3zzcJNmp1tTUrNM203XTZtQH1lDY' +
                    'Odu23rjiMecM7DnxoPYt/MkBXgfWDBoSFhe0G+QfkyOzJjcpFitILMgslCysKxYq1Sf1JIEhhR0TGT0UFA+wCSQEif7y+HjzMe4w6YzkVuCf3HfZ6dYA1cTT' +
                    'OtNk00LUz9UF2N3aSd494qnme+uf8AH2i/smAb0GOQyEEYkWMxtwHy8jYCb2KOkqLizCLKMs0CtMKh8oUSXsIf8dmhnOFK4PTwrHBCz/lPkV9MfuvukO5crg' +
                    'BN3L2SvXL9Xf00HTV9Mg1JnVvdeC2t/dxOEj5urqBvBi9ej6ggAbBpwL7hD7FbEa+x7IIgomsyi5KhIsuyyvLPErgSpnKKolViJ4Hh8aXhVHEO4KaQXP/zb6' +
                    's/Re70zqkeVA4WvdIdpv12DV/dNK00vTANRl1XbXKtp23UzhnuVa6m3vw/RG+uD/eQX+ClYQbBUtGoQeYSKzJW4ohir0K7EsuiwPLLQqrCgCJr4i7x6kGu0V' +
                    '3hCMCwsGcgDY+lL19u/c6hbmuOHU3XnatteU1RzUVdNC0+LTNNUy19PZD93W4BvlzOnW7iX0pPk8/9cEXwq9D9wUpxkMHvchWiUmKFIq0yukLMIsLCzkKvAo' +
                    'VyYkI2QfJht7FnURKQytBhUBevvx9Y/wbOuc5jHiP97U2v7XydU+1GPTO9PH0wXV79Z/2ancYuCZ5D/pQO6I8wL5mf40BMAJJA9LFCEZkh2MIf8k3ScbKrAr' +
                    'lSzILEYsEisxKasmiSPYH6cbCBcLEsYMTge5AR38kPYp8f7rI+es4qveMNtJ2AHWYtRz0zbTrtPY1K/WLNlG3O/fGOSy6Krt6/Jh+Pb9kgMgCYoOuROZGBYd' +
                    'HiGhJJEn4imLK4QsyyxdLD4rcCn8JusjSiAnHJMXoBJjDe8HXALA/DD3xPGR7KvnKOMZ347bldg71onUhdM005jTrdRx1tzY5Nt935njJ+gV7U/ywPdT/e8C' +
                    'gAjvDSYTEBiZHK8gQiREJ6cpYytxLMwscyxnK60pTCdMJLsgphweGDUT/g2QCP8CY/3R91/yJO016Kbjid/u2+TYd9ax1JrTNNOD04XUNdaN2ITbDt8c457n' +
                    'guy08SD3sPxLAt8HUw2SEoUXGxw/IOIj9CZqKTkrWyzLLIYsjyvoKZknqyQpISMdpxjIE5kOMAmiAwb+cfj78rntwOgl5PrfUNw12bXW3NSx0zfTcdNf1PvV' +
                    'Qdgm26DeoOIV5+/rGvGA9g38qAE+B7cM/BH6FpsbzR9/I6ImKykNK0MsxyyXLLQrISrkJwglliGeHS4ZWhQzD9AJRQSp/hP5mPNP7k3ppuRt4LPch9n21gnV' +
                    'ytM802HTO9TE1ffXyto03iXijuZe64Dw4fVq+wUBnQYaDGYRbRYZG1kfGiNPJuko3yopLMEspSzWK1cqLihjJQIiGB61GesUzQ9vCucETf+0+TX05e7a6Sjl' +
                    '4uAZ3dzZONc51eXTQ9NU0xnUjtWu13Dayd2s4Qjmzern70L1yPpiAPsFfAvPEN8VlhrjHrQi+SWlKK8qDCy5LLIs9yuLKnUovCVrIpAeOhp7FWUQDQuJBfD/' +
                    'VvrT9H3vaeqs5VjhgN0z2n3XatUD1EzTSdP601vVaNcY2mHdNeGE5T7qT++j9Cb6v/9ZBd4KNxBQFRIabB5MIqElYCh8Ku0rriy8LBUsvSq6KBMm0yIHH74a' +
                    'Chb9EKsLKwaTAPj6cfUV8PjqMObQ4endi9rE157VI9RY00DT3dMq1STXwtn63L/gAeWw6bjuBvSE+Rz/tgQ/Cp8PvxSNGfMd4iFIJRgoRyrMK6EswywxLO0q' +
                    '/ShoJjkjfB9AG5cWkxFJDM0GNgGb+xD2rvCJ67fmSuJU3ubaDdjU1UXUZtM608LT/NTi1m7ZldxK4H/kIuki7mnz4vh4/hQEoAkFDy4UBhl5HXYh7CTOJxAq' +
                    'qSuSLMgsSywbKz4puyadI+8fwRskFykS5gxuB9kBPvyw9kjxG+w+58Xiwd5C21jYDNZq1HbTNtOp08/Uo9Yc2TLc2N//45fojO3M8kH41f1xAwAJaw6cE34Y' +
                    '/RwIIY8kgifXKYMrgSzLLGIsRit9KQwn/yNhIEEcrxe+EoINDwh8AuH8UPfj8a7sx+dB4y/fodul2EfWkdSJ0zTTk9Ol1GXWzNjR22ffgOMM6PjsMPKg9zL9' +
                    'zgJgCNANCBP0F4AcmSAvJDQnmylbK20szCx3LG8ruSlbJ18k0SC/HDkYUhMdDrAIHwOE/fH3fvJC7VHov+Of3wHc9NiD1rrUntM103/TfdQp1n7Ycdv43gPj' +
                    'gudk7JXxAPeP/CsCvwc0DXQSaRcBHCggziPkJl0pMStXLMosiiyWK/QpqCe+JD8hOx3CGOUTuA5QCcIDJ/6S+Brz1+3c6D/kEeBj3EXZwtbl1LXTONNu01fU' +
                    '8NUy2BTbit6H4vrm0uv78GD27PuIAR4HlwzeEd4WgRu2H2sjkiYeKQQrPizGLJosuyssKvMnGiWsIbYdSRl3FFIP8AllBMr+M/m3823uaenA5ITgx9yY2QPX' +
                    'E9XP0z3TX9M01LnV6Ne42h7eDeJz5kHrYfDB9Ur75AB8BvoLSBFQFv8aQR8GIz4m3CjWKiMswCyoLN0rYio8KHUlFyIwHtAZCBXrD48KCAVt/9X5VfQD7/bp' +
                    'QuX54C3d7dlG10PV69NE01LTE9SE1aDXX9q03ZTh7uWw6snvIvWn+kEA2gVdC7EQwhV8GssenyLoJZgopSoGLLcstCz9K5YqgyjNJYAiqB5UGpcVgxAtC6oF' +
                    'EAB3+vP0m++F6sblcOGV3UTai9d11QnUTtNH0/TTUdVb1wfaTN0d4WrlIeox74T0Bfqe/zgFvgoZEDMV+BlUHjcikCVSKHIq5yusLL0sGyzHKsgoJCbnIh4f' +
                    '2BomFhsRywtMBrMAGfuR9TPwFetL5ujh/t2d2tLXqdUq1FvTP9PX0yHVF9ex2ebcp+Dn5JPpmu7m82P5+/6WBB8KgA+iFHIZ2x3MITYlCSg8KsUrnyzELDYs' +
                    '9yoKKXkmTSOTH1obsxaxEWgM7QZXAbv7MPbN8Kbr0uZi4mre+Noc2N/VTNRp0znTvdPz1NXWXtmB3DPgZeQG6QTuSfPC+Fj+8wOACeYOERTrGGAdYCHaJL8n' +
                    'BSqhK48sySxPLCQrSynLJrAjBiDbG0AXRxIFDY8H+gFe/ND2Z/E47Fnn3eLX3lXbZ9gY1nHUetM106XTx9SW1gzZHtzB3+Xje+hu7a3yIfi1/VAD4AhMDn4T' +
                    'YhjkHPIgfCRzJ8speyt9LMwsZixPK4kpHCcSJHcgWhzLF9wSoQ0vCJ0CAf1w9wLyy+zi51rjRd+027TYU9aZ1I3TNNOP053UWda82L7bUd9n4/Dn2uwR8oD3' +
                    'Ef2tAkAIsQ3rEtkXZxyDIBwkJCePKVMraCzMLHssdyvFKWsnciTnINgcVRhvEzwO0AhAA6T9Efid8mDtbejZ47bfFdwE2ZDWwtSj0zXTfNN11B7Wb9hf2+Le' +
                    '6uJn50fsdvHg9m78CgKfBxUNVhJOF+gbESC6I9QmUSkoK1IsyiyNLJ4r/ym3J9AkVSFUHd0YAhTXDnAJ4wNH/rL4OvP17fjoWeQo4HfcVdnP1u7UutM402vT' +
                    'UNTl1SPYAdt03m7i3+a169zwQPbM+2cB/gZ4DMARwRZnG54fVyOBJhEp+yo5LMUsnSzCKzcqAigsJcEhzx1kGZQUcQ8PCoYE6/5T+dfzi+6F6drknODc3KnZ' +
                    'ENcc1dTTPtNc0y3UrtXa16baCd704VnmJOtD8KH1KfvEAFwG2wsqETQW5RoqH/EiLSbOKMwqHiy+LKss5CtsKkoohyUsIkge6hkkFQoQrgooBY7/9fl09CLv' +
                    'E+pc5RHhQt3+2VTXTNXx00bTT9MM1HrVktdN2p/dfOHT5ZTqqu8C9Yf6IAC6BT0LkxCmFWIatB6KItYliiibKgAstSy2LAMsoCqRKN8llSLAHm8atBWiEE0L' +
                    'ygUxAJf6EvW576Lq4eWI4ardVtqZ13/VD9RR00XT7tNH1U3X9tk43QXhT+UF6hLvZPTl+X7/GAWeCvoPFhXdGTweISJ+JUMoZyrgK6ksvywhLNEq1Sg1Jvwi' +
                    'Nh/yGkIWORHrC2wG1AA5+7H1UvAy62bmAeIU3q/a4de01TDUXdM+09LTF9UK16DZ0dyQ4M3kd+l87sfzQ/na/nUE/wlhD4UUVxnDHbchIyX7JzEqviucLMYs' +
                    'PCwAKxcpiSZhI6ofdBvQFs8RiAwOB3cB3PtQ9uzww+vt5nvif94L2yvY6tVU1GzTONO40+rUydZN2W3cHOBM5Oro5u0q86L4N/7TA2AJxw70E88YSB1KIcck' +
                    'sCf5KZoriyzKLFQsLCtXKdwmxCMdIPQbXBdlEiQNrwcbAn/88PaG8Vbsdef24u3eaNt22CTWedR+0zXToNO+1IrW/NgL3KrfzONf6FHtjvIB+JT9MAPACC0O' +
                    'YRNHGMsc3CBpJGMnvylzK3kszCxrLFcrlSksJyYkjiBzHOYX+RLADVAIvgIi/ZD3IfLp7P7nc+Nc38fbxNhf1qHUkdM004vTldRN1q3Yqts6307j1ee97PLx' +
                    'YPfx/I0CHwiRDc0SvRdNHGwgCSQUJ4MpSitkLMssfyx/K9EpeieFJP0g8RxwGI0TWw7wCGEDxf0x+L3yfe2J6PLjzN8o3BTZnNbL1KfTNtN4027UEtZf2Ezb' +
                    'zN7R4kznKuxX8cD2TvzqAX8H9Qw4EjIXzhv7H6cjwyZEKR8rTSzJLJAspSsKKsYn4yRrIW0d+BgfFPYOkAkEBGj+0vhZ8xPuFOly5D/gi9xm2dzW99S/0znT' +
                    'Z9NJ1NrVFNjv2l/eVuLE5pjrvfAg9qv7RgHdBlkMohGlFk0bhx9DI3AmBCnyKjQsxCygLMkrQioRKD8l1yHnHX8ZsRSPDy8KpgQL/3T59vOp7qHp9OSz4PDc' +
                    'utke1ybV2tNA01nTJtSk1cvXlNr03dzhPuYH6yTwgfUJ+6MAPAa7CwwRGBbLGhIf3SIbJsEowioYLLwsrSzqK3cqWSiYJUEiYB4FGkEVKBDOCkkFr/8V+pT0' +
                    'QO8v6nflKeFX3RDaYddW1ffTSNNN0wbUb9WE1zvai91k4bnld+qM7+P0Zvo=',
                volume: 0.8
            },
            pickup: {
                src: 'data:audio/wav;base64,' +
                    'UklGRuwNAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YcgNAAAAAC0HGg6IFDwaBB+zIiklUCYdJpEkvCG2HaMYsxIZDBIF3/299u/vs+k/5Mff' +
                    'cdxc2pvZNdok3FbfsOMJ6TLv8vUN/UIEUQv6EQEYLx1WIU8kASZcJlwlCyN+H9QaOBXdDvsH0gCh+aryK+xf5nrhqd0O28DZzNkx2+Ldx+G95pfsIPMe+lAB' +
                    'dghRD6EVLhvFHz4jeCVhJu4lJSQWIdwcnheKEdgKxAOP/Hj1we6k6FvjFd/32x/andl22qHcDOCX5BrqYvA491z+jwWQDCATBBkFHvchtyQrJkcmCSV9Irke' +
                    '4BkdFKUNsQaC/1f4cfEO62jlsuAX3bjaqNnz2Zbbgd6b4r7nvO1f9Gv7nwK9CYMQsxYXHH0gviO8JWYmtCWvI2cg+huRFl0QlAl1AkH7N/SX7Z3ngOJt3onb' +
                    '7tmr2cLaKd3L4IblMeuY8YD4rP/bBswNQRT/GdIejyIUJUomJyarJOQh6x3kGPwSaQxlBTL+D/c88PfpeuT135Hcbdqc2SbaBtwq33fjxujm7qH1ufzuAwEL' +
                    'sBG/F/gcLCE0JPUlXyZvJS0jrh8QG34VKg9NCCYB9Pn58nPsneat4c/dJdvI2cTZGdu83ZPhfuZP7NHyy/n8ACQIBA9bFfIalh8cI2YlXSb7JUEkQSEUHeAX' +
                    '1REpCxgE4/zJ9Qzv5+iT40DfFdwt2pvZZNqB3N3fXOTV6Rbw5vYJ/jwFQQzXEsQY0B3QIZ4kIiZNJh8loSLrHh4aZRTzDQQH1v+p+L/xVOul5ePgO93M2q3Z' +
                    '6Nl821jeZeJ953LtD/QX+0sCbAk3EG8W3htQIJ8jrCVlJsQlzSOUIDQc1RapEOYJyQKV+4f04e3e57bilt6j2/nZptmu2gbdmuBK5evqSvEu+Fj/iAZ+DfkT' +
                    'wRmgHmoi/iRDJjAmwyQLIh8eIxlFE7gMuQWG/mH3ifA86rXkI+Cx3H/antkY2unb/94/44Pom+5Q9WX8mwOwCmURfRfBHAEhFyToJWImgSVPI90fSxvEFXcP' +
                    'nwh6AUf6SPO77N3m4eH13T3b0Nm92QLblt1g4T/mB+yC8nj5qADSB7YOFRW2GmYf+iJSJVomByZdJGohSh0iGB8SeQtrBDf9GvZX7yvpzONs3zPcPNqb2VTa' +
                    'Ydyw3yLkkenJ75T2tf3pBPELjhKDGJsdqCGEJBgmUyY0JcUiHR9bGqwUQQ5XByoA/PgN8pvr4uUV4V/d4dqz2d7ZYtsw3jDiPOcp7b/zxPr3ARoJ6g8rFqQb' +
                    'IyB/I5wlZSbTJesjwCBtHBkX9BA3Ch0D6PvX9CvuIOjs4r/ev9sF2qPZmtrk3GrgDuWl6vzw3PcE/zUGLw2xE4IZbR5EIuckPCY4JtskMSJTHmMZjRMHDQwG' +
                    '2v6z99bwgurw5FLg09yR2qHZC9rM29TeCONB6FDu//QS/EcDXwoaEToXiRzWIPoj2iVkJpMlbyMLIIYbCRbED/EIzgGb+pfzBO0c5xXiHN5V29nZttns2nHd' +
                    'LuEB5r/rNPIl+VQAgAdoDs8Ueho1H9ciPiVVJhImdySTIYAdYxhpEskLvwSL/Wz2o+9v6Qbkmd9R3EzamtlE2kLcg9/p403pfe9D9mH9lQShC0QSQhhlHX8h' +
                    'aiQNJlgmSCXpIk4fmBryFI8OqQd+AE/5W/Lj6yDmR+GD3ffaudnV2UnbCd774fzm4Oxw83H6pAHICJ4P5hVpG/QfXyOKJWMm4SUJJOsgpRxcFz8RiApxAzz8' +
                    'KPV27mLoJOPq3tvbEtqf2Yjawtw74NLkX+qv8Ir3sP7iBeAMaRNDGTkeHiLPJDQmQCbyJFcihh6hGdUTVg1fBi7/Bfgj8cjqLOWC4PXcpNqk2f/Zsduq3tHi' +
                    '/+cG7q/0vvvzAg4KzhD3FlAcqiDcI8slZSakJY8jOSDBG00WERBDCSEC7vrn803tXedK4kTeb9vj2bDZ19pN3fzgxOV46+bx0/gAAC0HGg6IFDwaBB+zIikl' +
                    'UCYdJpEkvCG2HaMYsxIZDBIF3/299u/vs+k/5Mffcdxc2pvZNdok3FbfsOMJ6TLv8vUN/UIEUQv6EQEYLx1WIU8kASZcJlwlCyN+H9QaOBXdDvsH0gCh+ary' +
                    'K+xf5nrhqd0O28DZzNkx2+Ldx+G95pfsIPMe+lABdghRD6EVLhvFHz4jeCVhJu4lJSQWIdwcnheKEdgKxAOP/Hj1we6k6FvjFd/32x/andl22qHcDOCX5Brq' +
                    'YvA491z+jwWQDCATBBkFHvchtyQrJkcmCSV9Irke4BkdFKUNsQaC/1f4cfEO62jlsuAX3bjaqNnz2Zbbgd6b4r7nvO1f9Gv7nwK9CYMQsxYXHH0gviO8JWYm' +
                    'tCWvI2cg+huRFl0QlAl1AkH7N/SX7Z3ngOJt3onb7tmr2cLaKd3L4IblMeuY8YD4rP/bBswNQRT/GdIejyIUJUomJyarJOQh6x3kGPwSaQxlBTL+D/c88Pfp' +
                    'euT135Hcbdqc2SbaBtwq33fjxujm7qH1ufzuAwELsBG/F/gcLCE0JPUlXyZvJS0jrh8QG34VKg9NCCYB9Pn58nPsneat4c/dJdvI2cTZGdu83ZPhfuZP7NHy' +
                    'y/n8ACQIBA9bFfIalh8cI2YlXSb7JUEkQSEUHeAX1REpCxgE4/zJ9Qzv5+iT40DfFdwt2pvZZNqB3N3fXOTV6Rbw5vYJ/jwFQQzXEsQY0B3QIZ4kIiZNJh8l' +
                    'oSLrHh4aZRTzDQQH1v+p+L/xVOul5ePgO93M2q3Z6Nk=',
                volume: 0.65
            },
            ui: {
                src: 'data:audio/wav;base64,' +
                    'UklGRnoKAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YVYKAAAAAPAHYg/dFfoaZx7tH3QfAx3CGPQS9ws6BDr8dvRq7YnnL+Oi4AzgdeHI5M7p' +
                    'OPCf94z/fwf7DocVuxpCHuUfiR80HQsZUhNjDK0Ervzj9Mrt1Odi47rgB+BT4Yvke+nT7y/3F/8NB5MOMBV6Ghse2x+cH2MdUxmuE84MIQUi/VH1Ku4h6Jfj' +
                    '0+AD4DPhUOQp6W/vv/ai/psGKw7YFDca8x3PH60fkB2aGQoUOQ2UBZf9v/WM7nDozePu4AHgFOEW5NfoDO9P9i7+KQbCDX8U9BnJHcEfvR+8Hd8ZZBSjDQcG' +
                    'C/4u9u7uv+gF5AvhAeD34N7jiOip7uD1uf22BVgNJRSvGZ4dsh/LH+YdIxq+FAwOeQZ//p32Ue8Q6T/kKuEC4Nvgp+M56EfucvVF/UMF7gzKE2kZcR2hH9cf' +
                    'Dx5mGhYVdA7rBvT+Dfe172LpeeRJ4QXgweBy4+vn5+0E9dH80ASDDG4TIRlCHY8f4h82HqcabRXcDl0Haf999xrwtem25GvhCuCp4D7jn+eH7Zb0XfxcBBcM' +
                    'EBPYGBIdex/rH1we5xrDFUMPzgfd/+73gPAK6vPkjuEQ4JLgC+NU5yjtKvTp++kDqwuyEo4Y4RxlH/IfgB4mGxgWqQ8/CFEAX/jm8F/qMuWz4RngfeDa4gvn' +
                    'yuy+83X7dQM+C1MSQxiuHE0f+B+jHmMbbBYPELAIxgDR+E3xtupz5dnhIuBq4KviwuZt7FLzAvsBA9AK8xH2F3kcNB/8H8Qenhu/FnMQIAk7AUP5tfEN67Xl' +
                    'AeIu4FjgfeJ75hLs5/KP+owCYgqSEagXQxwaH/4f4x7ZGxAX1xCPCa8Btfke8mbr+OUq4jvgSOBR4jXmt+t98hz6GAL0CTARWRcMHP4e/x8AHxEcYRc6Ef8J' +
                    'JAIn+ojywOs85lXiSeA54Cbi8eVd6xTyqfmjAYQJzRAIF9Mb4B7+Hx0fSRywF5sRbQqYApr68vIb7ILmguJa4Czg/eGu5QTrq/E3+S8BFQlpELcWmBvAHvwf' +
                    'Nx9+HP4X/BHbCgwDDftd83fsyeaw4mzgIeDV4WzlrepD8cX4ugClCAQQZBZdG58e+B9QH7McShhcEkkLgAOB+8jz1OwS59/if+AY4K/hLOVW6tzwVPhGADQI' +
                    'nw8QFh8bfR7yH2cf5hyVGLwStgv0A/X7NfQy7VznEOOU4BDgi+Ht5AHqdfDj99L/wwc5D7sV4RpYHuoffR8XHeAYGhMiDGgEaPyh9JDtp+dD46vgCuBo4bDk' +
                    'rekQ8HL3Xf9SB9IOZRWhGjMe4R+RH0cdKBl3E44M2wTc/A/18O3z53fjxOAF4Ebhc+Ra6avvAvfo/uAGag4NFV8aCx7WH6MfdR1wGdMT+QxPBVH9ffVR7kHo' +
                    'rePe4ALgJuE55AjpR++S9nT+bgYBDrUUHRriHckftB+iHbYZLhRjDcIFxf3r9bPuj+jk4/rgAeAI4QDkt+jk7iP2//37BZgNWxTYGbgdux/DH80d+xmIFM0N' +
                    'NAY6/lr2Fe/g6BzkF+EB4OzgyONo6ILutPWL/YgFLg0BFJMZjB2rH9Af9x0+GuEUNg6nBq7+yvZ57zHpVuQ24QPg0eCS4xroIe5G9Rf9FQXDDKUTTBleHZof' +
                    '3B8fHoAaORWeDhkHI/86993vg+mR5FfhB+C34F3jzefA7dj0ovyiBFgMSBMEGS8dhx/mH0YewRqQFQUPigeX/6r3QvDX6c7keeEM4KDgKeOB52Hta/Qu/C4E' +
                    '7AvrErsY/xxyH+4fax4AG+UVbA/7BwsAG/ip8CzqDOWd4RTgiuD44jfnAu3+87v7ugN/C4wScBjMHFwf9R+OHj4bOhbSD2wIgACM+A/xgupM5cLhHOB14Mfi' +
                    '7eal7JPzR/tGAxILLRIkGJkcRB/6H7AeexuNFjcQ3Qj1AP74d/HZ6o3l6eEn4GLgmeKm5knsJ/PU+tICpArMEdcXZBwqH/0f0B62G+AWmxBNCWkBcPnf8THr' +
                    'z+UR4jPgUeBr4l/m7eu98mH6XgI2CmsRiBctHA8f/x/vHu8bMRf+ELwJ3gHj+UjyiusT5jviQOBC4EDiGuaT61Py7vnpAccJCBE5F/Ub8h7/HwwfKByAF2ER' +
                    'KwpSAlX6svLk61jmZ+JQ4DTgFeLW5Tnr6vF8+XUBWAmlEOgWvBvTHv4fJx9eHM8XwhGZCscCyPod8z/snuaU4mHgKODt4ZPl4eqB8Qr5AAHoCEEQlhaBG7Me' +
                    '+h9BH5QcHBgjEgcLOwM8+4jznOzm5sPic+Ad4MbhUuWK6hrxmPiMAHgI3A9CFkQbkh71H1kfxxxoGIMSdAuvA6/79PP57C/n8+KI4BTgoOET5TTqs/Am+BcA' +
                    'Bwh2D+4VBxtuHu8fcB/6HLMY4RLhCyMEI/xg9Ffteuck453gDeB84dTk3+lN8Lb3o/+WBxAPmBXHGkke5x+FHyod/Rg/E00MlgSX/M30t+3F51jjteAI4Frh' +
                    'l+SM6efvRfcu/yQHqA5CFYcaIx7dH5gfWh1FGZwTuQwKBQv9O/UX7hLojOPO4ATgOeFc5Dnpg+/V9rr+sgZADuoURRr7HdEfqh+HHYwZ+BMjDX0Ff/2p9Xju' +
                    'YOjC4+ngAeAa4SLk6Ogf72X2Rf5ABtcNkRQBGtEdxB+6H7Md0hlSFI0N8AX0/Rj22u6v6PrjBeEB4P3g6eOX6L3u9vXR/c0Fbg03FL0Zph21H8gf3h0WGqwU' +
                    '9w1iBmj+h/Y97wDpM+Qj4QLg4eCy40joW+6I9Vz9WgUDDdwTdxl6HaUf1R8HHlkaBBVfDtQG3f739qHvUulu5EPhBeDG4Hzj++f67Rr16PznBJgMgBMvGUwd' +
                    'kh/gHy8emhpcFccORgdR/2f3BvCl6ankZOEJ4K7gSOOu55rtrPR0/HQELQwjE+cYHB1/H+kfVR7aGrIVLg+4B8b/1/dr8Pnp5+SH4Q/gl+AV42PnO+0/9AD8' +
                    'AATBC8USnRjrHGkf8R95HhkbBxaVDykIOgBI+NLwTuom5avhF+CB4OTiGefd7NPzjPuMA1QLZhJSGLgcUh/3H5weVxtbFvoPmQivALr4OfGk6mbl0eEg4G7g' +
                    'tOLR5oDsaPMZ+xgD5goGEgUYhBw6H/sfvR6SG64WXxAJCSMBLPmh8fzqp+X54SvgW+CG4onmJOz98qb6pAJ4CqURuBdOHB8f/h/dHs0bABfDEHkJmAGe+Qny' +
                    'VOvq5SLiOOBL4FriQ+bJ65LyM/ovAgoKQxFpFxccAx//H/seBhxRFyYR6AkMAhD6c/Ku6y7mTeJG4DzgL+L/5W/rKfLA+bsBmwnhEBgX3hvmHv8fFx8+HKAX' +
                    'iBFXCoECg/rd8gjsdOZ54lbgL+AF4rvlFuvA8U75RgErCX0QxxakG8ce/B8yH3Qc7hfpEcUK9QL2+kfzZOy75qbiaOAj4N3heeW+6ljx3PjSALsIGRB0Fmkb' +
                    'ph74H0sfqBw7GEkSMwtpA2r7s/PB7APn1uJ74Bngt+E55Wjq8PBq+F0ASgizDyEWLBuEHvMfYx/cHIYYqRKgC90D3fsf9B/tTecG45DgEeA=',
                volume: 0.55
            }
        }
    }
};

// Monster data
const MONSTERS = {
    rat: {
        name: "Giant Rat",
        symbol: "r",
        color: CONFIG.colors.entities.monster.rat,
        hp: 4,
        maxHp: 4,
        attack: 2,
        defense: 0,
        exp: 2,
        level: 1,
        speed: 100,
        abilities: [],
        behavior: "melee",
        spawnWeight: 12,
        depthScaling: -1,
        maxDepth: 5
    },
    snake: {
        name: "Cave Snake",
        symbol: "s",
        color: CONFIG.colors.entities.monster.snake,
        hp: 6,
        maxHp: 6,
        attack: 2, // Reduced from 3
        defense: 0,
        exp: 3,
        level: 1,
        speed: 100, // Reduced from 120 to match player speed
        abilities: ["poison"],
        behavior: "serpentine",
        segments: 4,
        spawnWeight: 10,
        depthScaling: -1,
        maxDepth: 6
    },
    goblin: {
        name: "Goblin",
        symbol: "g",
        color: CONFIG.colors.entities.monster.goblin,
        hp: 6, // Reduced from 8
        maxHp: 6, // Reduced from 8
        attack: 2, // Reduced from 3
        defense: 1,
        exp: 5,
        level: 2,
        speed: 100,
        abilities: [],
        behavior: "melee", // Ensures goblin uses meleeMovement
        spawnWeight: 8,
        depthScaling: 1
    },
    orc: {
        name: "Orc Warrior",
        symbol: "o",
        color: CONFIG.colors.entities.monster.orc,
        hp: 12,
        maxHp: 12,
        attack: 5,
        defense: 2,
        exp: 8,
        level: 3,
        speed: 90,
        abilities: ["rage"],
        spawnWeight: 5,
        depthScaling: 2
    },
    troll: {
        name: "Cave Troll",
        symbol: "T",
        color: CONFIG.colors.entities.monster.troll,
        hp: 20,
        maxHp: 20,
        attack: 8,
        defense: 3,
        exp: 15,
        level: 5,
        speed: 80,
        abilities: ["regeneration"],
        spawnWeight: 2,
        depthScaling: 2
    },
    wisp: {
        name: "Will-o-wisp",
        symbol: "w",
        color: "#7af",
        hp: 3,
        maxHp: 3,
        attack: 2,
        defense: 0,
        exp: 4,
        level: 2,
        speed: 150,
        abilities: ["lighting"],
        behavior: "random",
        spawnWeight: 4,
        depthScaling: 1
    },
    kraken: {
        name: "Kraken Spawn",
        symbol: "K",
        color: "#0af",
        hp: 15,
        maxHp: 15,
        attack: 5,
        defense: 2,
        exp: 10,
        level: 4,
        speed: 80,
        abilities: ["grab"],
        behavior: "tentacle",
        segments: 6,
        tentacleColor: ["#089", "#067", "#056", "#045", "#034"],
        spawnWeight: 1,
        depthScaling: 2
    },
    shoggoth: {
        name: "Shoggoth",
        symbol: "S",
        color: "#a0f", 
        hp: 30,
        maxHp: 30,
        attack: 7,
        defense: 4,
        exp: 25,
        level: 7,
        speed: 60,
        abilities: ["dissolve", "split"],
        behavior: "tentacle",
        segments: 8,
        tentacleColor: ["#90d", "#80c", "#70b", "#609", "#508", "#407"],
        spawnWeight: 1,
        depthScaling: 2
    },
    hydra: {
        name: "Cave Hydra",
        symbol: "H",
        color: "#0c0",
        hp: 20,
        maxHp: 20,
        attack: 6,
        defense: 3,
        exp: 15,
        level: 5, 
        speed: 90,
        abilities: ["regrowth"],
        behavior: "multi_tentacle",
        segments: 5,
        heads: 3,
        tentacleColor: ["#0b0", "#090", "#070", "#050"],
        spawnWeight: 1,
        depthScaling: 2
    }
};

// Item data
const ITEMS = {
    healthPotion: {
        name: "Health Potion",
        symbol: "!",
        color: CONFIG.colors.entities.item.potion,
        type: "potion",
        effect: "heal",
        power: 10,
        stackable: true,
        baseWeight: 18,
        depthScaling: 0
    },
    strengthPotion: {
        name: "Strength Potion",
        symbol: "!",
        color: CONFIG.colors.entities.item.potion,
        type: "potion",
        effect: "strength",
        power: 2,
        duration: 20,
        stackable: true,
        minDepth: 2,
        baseWeight: 4,
        depthScaling: 1
    },
    shortSword: {
        name: "Short Sword",
        symbol: ")",
        color: CONFIG.colors.entities.item.weapon,
        type: "weapon",
        slot: "hand",
        attack: 3,
        modifiers: { attack: 3 },
        stackable: false,
        maxDepth: 5,
        baseWeight: 9,
        depthScaling: -2
    },
    longsword: {
        name: "Longsword",
        symbol: ")",
        color: CONFIG.colors.entities.item.weapon,
        type: "weapon",
        slot: "hand",
        attack: 5,
        modifiers: { attack: 5 },
        onHitStatus: {
            type: 'sundered',
            duration: 3,
            modifiers: { defense: -1 },
            message: 'Your strike sunders its defenses!',
            messageColor: CONFIG.colors.ui.highlight,
            expireMessage: 'The enemy regains its guard.',
            expireMessageColor: CONFIG.colors.ui.info
        },
        stackable: false,
        minDepth: 3,
        baseWeight: 2,
        depthScaling: 2
    },
    leatherArmor: {
        name: "Leather Armor",
        symbol: "[",
        color: CONFIG.colors.entities.item.armor,
        type: "armor",
        slot: "body",
        defense: 1,
        modifiers: { defense: 1, maxHp: 2 },
        stackable: false,
        maxDepth: 5,
        baseWeight: 8,
        depthScaling: -1
    },
    chainmail: {
        name: "Chainmail",
        symbol: "[",
        color: CONFIG.colors.entities.item.armor,
        type: "armor",
        slot: "body",
        defense: 3,
        modifiers: { defense: 3, maxHp: 4 },
        stackable: false,
        minDepth: 3,
        baseWeight: 2,
        depthScaling: 2
    },
    bread: {
        name: "Bread Ration",
        symbol: "%",
        color: CONFIG.colors.entities.item.food,
        type: "food",
        nutrition: 300,
        stackable: true,
        baseWeight: 10,
        depthScaling: -1
    },
    scrollMagicMapping: {
        name: "Scroll of Magic Mapping",
        symbol: "?",
        color: CONFIG.colors.entities.item.scroll,
        type: "scroll",
        effect: "magic_mapping",
        stackable: true,
        minDepth: 2,
        baseWeight: 3,
        depthScaling: 1
    },
    scrollTeleport: {
        name: "Scroll of Teleportation",
        symbol: "?",
        color: CONFIG.colors.entities.item.scroll,
        type: "scroll",
        effect: "teleport",
        stackable: true,
        minDepth: 3,
        baseWeight: 3,
        depthScaling: 2
    }
};

function getItemSpawnWeights(depth) {
    const weights = {};

    if (!depth || depth < 1) {
        depth = 1;
    }

    for (const [id, item] of Object.entries(ITEMS)) {
        const minDepth = item.minDepth || 1;
        const maxDepth = item.maxDepth || Infinity;

        if (depth < minDepth || depth > maxDepth) {
            continue;
        }

        let weight = item.baseWeight != null ? item.baseWeight : 5;
        const scaling = item.depthScaling || 0;

        if (scaling !== 0) {
            const depthDelta = depth - minDepth;
            weight += depthDelta * scaling;
        }

        weight = Math.max(1, Math.floor(weight));

        if (weight > 0) {
            weights[id] = weight;
        }
    }

    return weights;
}

window.getItemSpawnWeights = getItemSpawnWeights;

// Player skills
const SKILLS = {
    swordmastery: {
        name: "Sword Mastery",
        description: "Increases damage with swords by 20%",
        cost: 3,
        requires: []
    },
    toughness: {
        name: "Toughness",
        description: "Increases max HP by 10",
        cost: 2,
        requires: []
    },
    evasion: {
        name: "Evasion",
        description: "15% chance to completely avoid an attack",
        cost: 4,
        requires: []
    },
    criticalStrike: {
        name: "Critical Strike",
        description: "10% chance to deal double damage",
        cost: 3,
        requires: ["swordmastery"]
    },
    regeneration: {
        name: "Regeneration",
        description: "Slowly recover HP over time",
        cost: 5,
        requires: ["toughness"]
    }
};

// Utility functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function pickRandomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return null;
    }

    const index = Math.floor(Math.random() * array.length);
    return array[index];
}
