# cv-tailoring-agent

Two independent passes: (1) generate a tailored CV from a CPO + JPO, (2) a
separate fact-checker pass that verifies every claim against the CPO and
strips unsupported additions. Generation and verification never share a model
call — this is what makes "no fabrication" a structural guarantee, not a
prompt instruction.

Status: not yet implemented — designed in Phase 5.
