# Import the QISKit SDK
from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister, QuantumProgram
from qiskit import available_backends, execute

from qiskit import register
import Qconfig

register(Qconfig.APItoken, Qconfig.config["url"])

qp = QuantumProgram()

# Create a Quantum Register with 2 qubits.
q = QuantumRegister(3)
# Create a Classical Register with 2 bits.
c = ClassicalRegister(3)
# Create a Quantum Circuit
qca = QuantumCircuit(q, c)
qcb = QuantumCircuit(q, c)

qca.x(q[1])




# Add a H gate on qubit 0, putting this qubit in superposition.
qcb.h(q[0])
# Add a CX (CNOT) gate on control qubit 0 and target qubit 1, putting
# the qubits in a Bell state.
qcb.cx(q[0], q[1])

# Add a Measure gate to see the state.
qcb.measure(q, c)

qca.extend(qcb)

qp.add_circuit("bell", qca)

print(qp.get_qasm("bell"))

# See a list of available local simulators
print("Local backends: ", available_backends({'local': False}))

# Compile and run the Quantum circuit on a simulator backend
sim_result = qp.execute(backend = "ibmqx4", shots = 1)


# Show the results
print("simulation: ", sim_result)

counts_dict = sim_result.get_counts("bell")
print(list(counts_dict.keys())[0])